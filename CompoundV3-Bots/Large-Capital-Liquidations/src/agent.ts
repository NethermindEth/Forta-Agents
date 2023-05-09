import { ethers, Finding, Initialize, HandleBlock, BlockEvent, getEthersBatchProvider } from "forta-agent";
import Bottleneck from "bottleneck";
import { MulticallContract, MulticallProvider, NetworkManager } from "forta-agent-tools";

import CONFIG, { DEBUG, DEBUG_CONFIG, DEBUG_CURRENT_BLOCK } from "./agent.config";
import { COMET_ABI } from "./constants";
import {
  addPositionsToMonitoringList,
  AgentState,
  presentValueBorrow,
  NetworkData,
  getPotentialBorrowersFromLogs,
  multicallAll,
} from "./utils";
import { createAbsorbFinding, createLiquidationRiskFinding } from "./finding";

export const provideInitializeTask = (
  state: AgentState,
  networkManager: NetworkManager<NetworkData>,
  multicallProvider: MulticallProvider,
  provider: ethers.providers.JsonRpcProvider
): (() => Promise<void>) => {
  const iface = new ethers.utils.Interface(COMET_ABI);
  const cometContracts = networkManager.get("cometContracts").map((comet) => ({
    comet: new ethers.Contract(comet.address, iface, provider),
    multicallComet: new MulticallContract(comet.address, iface.fragments as ethers.utils.Fragment[]),
    deploymentBlock: comet.deploymentBlock,
    baseIndexScale: ethers.BigNumber.from(0),
    baseBorrowIndex: ethers.BigNumber.from(0),
    monitoringListLength: comet.monitoringListLength,
    threshold: ethers.BigNumber.from(comet.baseLargeThreshold),
  }));

  const blockTag = !DEBUG ? "latest" : DEBUG_CURRENT_BLOCK;

  return async () => {
    let currentBlock = !DEBUG ? await provider.getBlockNumber() : DEBUG_CURRENT_BLOCK;
    let blockCursor = cometContracts.reduce((a, b) => (a.deploymentBlock < b.deploymentBlock ? a : b)).deploymentBlock;

    // get current borrow data to compute present values
    await Promise.all(
      cometContracts.map(async (entry) => {
        entry.baseBorrowIndex = await entry.comet.baseIndexScale({ blockTag });
        entry.baseBorrowIndex = (await entry.comet.totalsBasic({ blockTag })).baseBorrowIndex;
      })
    );

    const blockRange = networkManager.get("logFetchingBlockRange");
    const bottleneck = new Bottleneck({
      minTime: networkManager.get("logFetchingInterval"),
    });

    // for each block range
    for (; blockCursor < currentBlock; blockCursor += blockRange) {
      if (state.lastHandledBlock) currentBlock = state.lastHandledBlock;

      const toBlock = Math.min(blockCursor + blockRange - 1, currentBlock);
      const contractsToScan = cometContracts.filter((entry) => entry.deploymentBlock <= toBlock);

      await Promise.all(
        contractsToScan.map(
          async ({ comet, multicallComet, monitoringListLength, threshold, baseBorrowIndex, baseIndexScale }) => {
            // get relevant logs for this Comet contract
            const logs = await bottleneck.schedule(async () => {
              return (
                await provider.getLogs({
                  topics: [["Supply", "Transfer", "Withdraw", "AbsorbDebt"].map((el) => iface.getEventTopic(el))],
                  fromBlock: blockCursor,
                  toBlock: Math.min(blockCursor + blockRange - 1, currentBlock),
                  address: comet.address,
                })
              ).map((log) => ({ ...log, ...iface.parseLog(log) }));
            });

            // get borrowers and principals from potential borrowers involved in the logs
            const borrowers = getPotentialBorrowersFromLogs(logs);
            const userBasics = await multicallAll(
              multicallProvider,
              borrowers.map((borrower) => multicallComet.userBasic(borrower)),
              blockTag,
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

            console.log(
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

    console.log("Finished initialize task");
    state.initialized = true;
  };
};

export const provideInitialize = (
  state: AgentState,
  networkManager: NetworkManager<NetworkData>,
  multicallProvider: MulticallProvider,
  provider: ethers.providers.JsonRpcProvider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
    await multicallProvider.init();

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
  const iface = new ethers.utils.Interface(COMET_ABI);

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    if (!state.initialized) {
      state.lastHandledBlock = blockEvent.blockNumber;
      return [];
    }

    const cometContracts = networkManager.get("cometContracts").map((comet) => ({
      comet: new ethers.Contract(comet.address, iface, provider),
      multicallComet: new MulticallContract(comet.address, iface.fragments as ethers.utils.Fragment[]),
      threshold: ethers.BigNumber.from(comet.baseLargeThreshold),
      monitoringListLength: comet.monitoringListLength,
    }));

    const chainId = networkManager.getNetwork();

    // if this is the first handler call, consider the initialization block for log fetching
    const fromBlock =
      state.lastHandledBlock === blockEvent.blockNumber - 1
        ? Math.min(state.initializationBlock + 1, blockEvent.blockNumber)
        : blockEvent.blockNumber;

    const findings: Finding[] = [];

    // asynchronously  for each Comet contract
    await Promise.all(
      cometContracts.map(async ({ comet, multicallComet, threshold, monitoringListLength }) => {
        // get relevant logs for this Comet contract
        const cometLogs = (
          await provider.getLogs({
            topics: [["Supply", "Transfer", "Withdraw", "AbsorbDebt"].map((el) => iface.getEventTopic(el))],
            fromBlock,
            toBlock: blockEvent.blockNumber,
            address: comet.address,
          })
        ).map((log) => ({ ...log, ...iface.parseLog(log) }));

        // get current borrow data to compute present values
        const baseIndexScale = await comet.baseIndexScale({ blockTag: blockEvent.blockNumber });
        const { baseBorrowIndex } = await comet.totalsBasic({ blockTag: blockEvent.blockNumber });

        // if there's a big absorption, emit a finding
        cometLogs.forEach((log) => {
          if (log.name === "AbsorbDebt" && (log.args.basePaidOut as ethers.BigNumber).gte(threshold)) {
            findings.push(
              createAbsorbFinding(comet.address, log.args.absorber, log.args.borrower, log.args.basePaidOut, chainId)
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
            findings.push(
              createLiquidationRiskFinding(
                comet.address,
                entry.borrower,
                presentValueBorrow(entry, baseBorrowIndex, baseIndexScale),
                chainId
              )
            );
            entry.alertedAt = blockEvent.block.timestamp;
          }
        });
      })
    );

    return findings;
  };
};

const provider = getEthersBatchProvider();
const networkManager = new NetworkManager(!DEBUG ? CONFIG : DEBUG_CONFIG);
const multicallProvider = new MulticallProvider(provider);
const state: AgentState = {
  initialized: false,
  monitoringLists: {},
  lastHandledBlock: 0,
  initializationBlock: 0,
};

export default {
  initialize: provideInitialize(state, networkManager, multicallProvider, provider),
  handleBlock: provideHandleBlock(state, networkManager, multicallProvider, provider),
};
