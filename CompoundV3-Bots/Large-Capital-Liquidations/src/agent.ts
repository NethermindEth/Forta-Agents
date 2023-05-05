import { ethers, Finding, Initialize, HandleBlock, BlockEvent, getEthersBatchProvider } from "forta-agent";
import Bottleneck from "bottleneck";
import { MulticallContract, MulticallProvider, NetworkManager } from "forta-agent-tools";

import CONFIG from "./agent.config";
import { COMET_ABI } from "./constants";
import { addPositionsToMonitoringList, AgentState, borrowLiquidity, NetworkData } from "./utils";
import { createAbsorbFinding, createLiquidationRiskFinding } from "./finding";

export const provideInitializeTask = (
  state: AgentState,
  networkManager: NetworkManager<NetworkData>,
  multicallProvider: MulticallProvider,
  provider: ethers.providers.JsonRpcProvider
): (() => Promise<void>) => {
  const blockRange = 2_000;
  const iface = new ethers.utils.Interface(COMET_ABI);

  const scanState = networkManager.get("cometContracts").map((comet) => ({
    comet: new ethers.Contract(comet.address, iface, provider),
    multicallComet: new MulticallContract(comet.address, iface.fragments as ethers.utils.Fragment[]),
    blockCursor: comet.deploymentBlock,
    monitoringListLength: comet.monitoringListLength,
    threshold: ethers.BigNumber.from(comet.baseLargeThreshold),
  }));

  return async () => {
    await Promise.all(
      scanState.map(async ({ comet, multicallComet, blockCursor, threshold, monitoringListLength }) => {
        const bottleneck = new Bottleneck({
          minTime: 1_000,
        });

        const baseIndexScale = await comet.baseIndexScale({ blockTag: "latest" });
        const { baseBorrowIndex } = await comet.totalsBasic({ blockTag: "latest" });

        state.lastHandledBlock = await provider.getBlockNumber();

        while (blockCursor < state.lastHandledBlock) {
          const withdrawLogs = await bottleneck.schedule(async () => {
            return await comet.queryFilter("Withdraw", blockCursor, blockCursor + blockRange - 1);
          });

          const borrowers = Array.from(new Set(withdrawLogs.map((log) => log.args!.src)));
          const [success, userBasics] = (await multicallProvider.all(
            borrowers.map((borrower) => multicallComet.userBasic(borrower)),
            "latest",
            100
          )) as [boolean, { principal: ethers.BigNumber }[]];

          if (!success) throw new Error("Error while fetching user principals");

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
            `Scanned withdrawals on Comet ${comet.address} from block ${blockCursor} to ${blockCursor + blockRange - 1}`
          );

          blockCursor += blockRange;
        }
      })
    );

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
    initializeTask();
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
    const logs = (
      await provider.getLogs({
        topics: [["Supply", "Withdraw", "AbsorbDebt"].map((el) => iface.getEventTopic(el))],
        fromBlock: blockEvent.blockNumber,
        toBlock: blockEvent.blockNumber,
      })
    ).map((log) => ({ ...log, ...iface.parseLog(log) }));

    const findings: Finding[] = [];

    await Promise.all(
      cometContracts.map(async ({ comet, multicallComet, threshold, monitoringListLength }) => {
        const cometLogs = logs.filter((log) => log.address.toLowerCase() === comet.address.toLowerCase());
        const baseIndexScale = await comet.baseIndexScale({ blockTag: blockEvent.blockNumber });
        const { baseBorrowIndex } = await comet.totalsBasic({ blockTag: blockEvent.blockNumber });

        let changedPositions = new Set<string>();

        cometLogs.forEach((log) => {
          switch (log.name) {
            case "Supply":
              changedPositions.add(log.args.dst);
              break;
            case "Withdraw":
              changedPositions.add(log.args.src);
              break;
            case "AbsorbDebt":
              if ((log.args.basePaidOut as ethers.BigNumber).gte(threshold)) {
                findings.push(createAbsorbFinding(comet.address, log.args.absorber, log.args.borrower, log.args.basePaidOut, chainId));
              }
              changedPositions.add(log.args.borrower);
              break;
          }
        });

        const borrowers = Array.from(changedPositions);

        const [userBasicsSuccess, userBasics] = (await multicallProvider.all(
          Array.from(changedPositions).map((borrower) => multicallComet.userBasic(borrower)),
          blockEvent.block.number,
          100
        )) as [boolean, { principal: ethers.BigNumber }[]];

        if (!userBasicsSuccess) throw new Error("Error while fetching user principals");

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

        const largePositions = state.monitoringLists[comet.address].filter((entry) =>
          borrowLiquidity(entry, baseBorrowIndex, baseIndexScale).gte(threshold)
        );

        let [borrowerStatusesSuccess, borrowerStatuses] = await multicallProvider.all(
          largePositions.map((entry) => multicallComet.isBorrowCollateralized(entry.borrower)),
          blockEvent.block.number,
          100
        );

        if (!borrowerStatusesSuccess) throw new Error("Error while trying to fetch borrow collateralization status");

        largePositions.forEach((entry, idx) => {
          const isBorrowCollateralized = borrowerStatuses[idx];
          if (
            !isBorrowCollateralized &&
            blockEvent.block.timestamp - entry.alertedAt > networkManager.get("alertInterval")
          ) {
            findings.push(
              createLiquidationRiskFinding(
                comet.address,
                entry.borrower,
                borrowLiquidity(entry, baseBorrowIndex, baseIndexScale),
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
const networkManager = new NetworkManager(CONFIG);
const multicallProvider = new MulticallProvider(provider);
const state: AgentState = {
  initialized: false,
  monitoringLists: {},
  lastHandledBlock: 0,
};

export default {
  initialize: provideInitialize(state, networkManager, multicallProvider, provider),
  handleBlock: provideHandleBlock(state, networkManager, multicallProvider, provider),
};
