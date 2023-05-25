import { ethers, Finding, Initialize, HandleBlock, BlockEvent, getEthersBatchProvider } from "forta-agent";
import Bottleneck from "bottleneck";
import { MulticallContract, MulticallProvider, NetworkManager } from "forta-agent-tools";

import CONFIG, { DEBUG, DEBUG_CONFIG, DEBUG_CURRENT_BLOCK } from "./agent.config";
import { COMET_ABI, MAX_FINDINGS } from "./constants";
import { createAbsorbFinding, createLiquidationRiskFinding } from "./finding";
import {
  AgentState,
  NetworkData,
  addPositionsToMonitoringList,
  presentValueBorrow,
  getPotentialBorrowersFromLogs,
  multicallAll,
  log,
} from "./utils";

export const provideInitializeTask = (
  state: AgentState,
  networkManager: NetworkManager<NetworkData>,
  multicallProvider: MulticallProvider,
  provider: ethers.providers.JsonRpcProvider
): (() => Promise<void>) => {
  const cometContracts = state.cometContracts.map((entry) => ({
    ...entry,
    baseIndexScale: ethers.BigNumber.from(0),
    baseBorrowIndex: ethers.BigNumber.from(0),
  }));

  return async () => {
    let currentBlock = !DEBUG ? await provider.getBlockNumber() : DEBUG_CURRENT_BLOCK;
    let blockCursor = state.cometContracts.reduce((a, b) =>
      a.deploymentBlock < b.deploymentBlock ? a : b
    ).deploymentBlock;

    // get current borrow data to compute present values
    await Promise.all(
      cometContracts.map(async (entry) => {
        entry.baseIndexScale = await entry.comet.baseIndexScale({ blockTag: "latest" });
        entry.baseBorrowIndex = (await entry.comet.totalsBasic({ blockTag: "latest" })).baseBorrowIndex;
      })
    );

    const blockRange = networkManager.get("logFetchingBlockRange");
    const bottleneck = new Bottleneck({
      minTime: networkManager.get("logFetchingInterval"),
    });

    // for each block range
    for (; blockCursor <= currentBlock; blockCursor += blockRange) {
      if (state.lastHandledBlock) currentBlock = state.lastHandledBlock;

      const toBlock = Math.min(blockCursor + blockRange - 1, currentBlock);
      const contractsToScan = cometContracts.filter((entry) => entry.deploymentBlock <= toBlock);

      await Promise.all(
        contractsToScan.map(
          async ({ comet, multicallComet, monitoringListLength, threshold, baseBorrowIndex, baseIndexScale }) => {
            const toBlock = Math.min(blockCursor + blockRange - 1, currentBlock);

            // get principal-changing logs for this Comet contract
            const logs = await bottleneck.schedule(async () => {
              return (
                await provider.getLogs({
                  topics: [
                    ["Supply", "Transfer", "Withdraw", "AbsorbDebt"].map((el) => comet.interface.getEventTopic(el)),
                  ],
                  fromBlock: blockCursor,
                  toBlock,
                  address: comet.address,
                })
              ).map((log) => ({ ...log, ...comet.interface.parseLog(log) }));
            });

            // get borrowers and principals from potential borrowers involved in the logs
            const borrowers = getPotentialBorrowersFromLogs(logs);
            const userBasics = await multicallAll(
              multicallProvider,
              borrowers.map((borrower) => multicallComet.userBasic(borrower)),
              toBlock,
              networkManager.get("multicallSize")
            );

            addPositionsToMonitoringList(
              state,
              comet.address,
              monitoringListLength,
              borrowers.map((borrower, idx) => ({
                borrower,
                principal: userBasics[idx].principal,
                alertedAt: 0,
              })),
              threshold,
              baseBorrowIndex,
              baseIndexScale
            );

            log(
              `Scanned withdrawals on Comet ${comet.address} from block ${blockCursor} to ${
                blockCursor + blockRange - 1
              }`
            );
          }
        )
      );
    }

    // update the initialization block to avoid any blocks being missed
    state.initializationBlock = currentBlock;

    log("Finished initialize task");
    state.initialized = true;
  };
};

export const provideInitialize = (
  state: AgentState,
  networkManager: NetworkManager<NetworkData>,
  multicallProvider: MulticallProvider,
  provider: ethers.providers.JsonRpcProvider
): Initialize => {
  const cometIface = new ethers.utils.Interface(COMET_ABI);

  return async () => {
    await networkManager.init(provider);
    await multicallProvider.init();

    state.cometContracts = networkManager.get("cometContracts").map((cometInfo) => ({
      comet: new ethers.Contract(cometInfo.address, cometIface, provider),
      multicallComet: new MulticallContract(cometInfo.address, cometIface.fragments as ethers.utils.Fragment[]),
      threshold: ethers.BigNumber.from(cometInfo.baseLargeThreshold),
      monitoringListLength: cometInfo.monitoringListLength,
      deploymentBlock: cometInfo.deploymentBlock,
    }));

    const initializeTask = provideInitializeTask(state, networkManager, multicallProvider, provider);

    // if debugging, await the long-running task so it's easier to manage
    if (DEBUG) {
      await initializeTask();
    } else {
      initializeTask();
    }
  };
};

export const provideHandleBlock = (
  state: AgentState,
  networkManager: NetworkManager<NetworkData>,
  multicallProvider: MulticallProvider,
  provider: ethers.providers.JsonRpcProvider
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    if (!state.initialized) {
      state.lastHandledBlock = blockEvent.blockNumber;
      return [];
    }

    const chainId = networkManager.getNetwork();

    // if this is the first handler call, consider the initialization block for log fetching
    const fromBlock =
      state.lastHandledBlock === blockEvent.blockNumber - 1
        ? Math.min(state.initializationBlock + 1, blockEvent.blockNumber)
        : blockEvent.blockNumber;

    // asynchronously for each Comet contract
    await Promise.all(
      state.cometContracts.map(async ({ comet, multicallComet, threshold, monitoringListLength }) => {
        // get principal-changing logs and current borrow data to compute present values
        const [cometLogs, baseIndexScale, { baseBorrowIndex }] = await Promise.all([
          provider
            .getLogs({
              topics: [["Supply", "Transfer", "Withdraw", "AbsorbDebt"].map((el) => comet.interface.getEventTopic(el))],
              fromBlock,
              toBlock: blockEvent.blockNumber,
              address: comet.address,
            })
            .then((logs) => logs.map((log) => ({ ...log, ...comet.interface.parseLog(log) }))),
          comet.baseIndexScale({ blockTag: blockEvent.blockNumber }),
          comet.totalsBasic({ blockTag: blockEvent.blockNumber }),
        ]);

        // if there's a big absorption, emit a finding
        cometLogs.forEach((log) => {
          if (log.name === "AbsorbDebt" && (log.args.basePaidOut as ethers.BigNumber).gte(threshold)) {
            state.findingBuffer.push(
              createAbsorbFinding(
                comet.address,
                log.args.absorber,
                log.args.borrower,
                log.args.basePaidOut,
                chainId,
                blockEvent.blockNumber
              )
            );
          }
        });

        // get borrowers and principals from potential borrowers involved in the logs
        const borrowers = getPotentialBorrowersFromLogs(cometLogs);
        const userBasics = await multicallAll(
          multicallProvider,
          borrowers.map((borrower) => multicallComet.userBasic(borrower)),
          blockEvent.block.number,
          networkManager.get("multicallSize")
        );

        addPositionsToMonitoringList(
          state,
          comet.address,
          monitoringListLength,
          borrowers.map((borrower, idx) => ({
            borrower,
            principal: userBasics[idx].principal,
            alertedAt: 0,
          })),
          threshold,
          baseBorrowIndex,
          baseIndexScale
        );

        const eligiblePositions = state.monitoringLists[comet.address].filter((entry) => {
          const isLarge = presentValueBorrow(entry, baseBorrowIndex, baseIndexScale).gte(threshold);
          const isNotUnderCooldown =
            !entry.alertedAt || blockEvent.block.timestamp - entry.alertedAt >= networkManager.get("alertInterval");

          return isLarge && isNotUnderCooldown;
        });

        // get borrow position collateralization status for all eligible positions
        const borrowerStatuses = await multicallAll(
          multicallProvider,
          eligiblePositions.map((entry) => multicallComet.isBorrowCollateralized(entry.borrower)),
          blockEvent.block.number,
          networkManager.get("multicallSize")
        );

        // if an eligible borrow position is not collateralized, emit a finding and set its alert timestamp
        eligiblePositions.forEach((entry, idx) => {
          if (!borrowerStatuses[idx]) {
            state.findingBuffer.push(
              createLiquidationRiskFinding(
                comet.address,
                entry.borrower,
                presentValueBorrow(entry, baseBorrowIndex, baseIndexScale),
                chainId,
                blockEvent.blockNumber
              )
            );
            entry.alertedAt = blockEvent.block.timestamp;
          }
        });
      })
    );

    if (state.findingBuffer.length > MAX_FINDINGS) {
      console.warn(
        `The finding limit for the block ${blockEvent.blockNumber} has been reached - some findings were stored and will be sent in future blocks`
      );
    }

    return state.findingBuffer.splice(0, MAX_FINDINGS);
  };
};

const provider = getEthersBatchProvider();
const networkManager = new NetworkManager(!DEBUG ? CONFIG : DEBUG_CONFIG);
const multicallProvider = new MulticallProvider(provider);
const state: AgentState = {
  initialized: false,
  monitoringLists: {},
  cometContracts: [],
  lastHandledBlock: 0,
  initializationBlock: 0,
  findingBuffer: [],
};

export default {
  initialize: provideInitialize(state, networkManager, multicallProvider, provider),
  handleBlock: provideHandleBlock(state, networkManager, multicallProvider, provider),
};
