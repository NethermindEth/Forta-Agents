import { NetworkData, networkData } from "./network";
import { BlockEvent, ethers, Finding, HandleBlock, Log } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";

import utils from "./utils";

const networkManager = new NetworkManager(networkData);
let lastExecutedBlock: number;
export const provideInitialize = (provider: ethers.providers.JsonRpcProvider) => {
  return async () => {
    lastExecutedBlock = 0;
    await networkManager.init(provider);
  };
};

export const provideHandleBlock =
  (networkManager: NetworkManager<NetworkData>, provider: ethers.providers.JsonRpcProvider): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const currentBlockNumber = blockEvent.block.number;
    const fromBlock = currentBlockNumber - networkManager.get("blockNumber") || currentBlockNumber;
    if (lastExecutedBlock !== 0 && currentBlockNumber - lastExecutedBlock < networkManager.get("threshold")) {
      return [];
    }
    const filter = {
      fromBlock,
      toBlock: currentBlockNumber,
      address: networkManager.get("address"),
      topics: [utils.EVENTS_IFACE.getEventTopic(utils.DECREASE_POSITION_EVENT)],
    };

    const decreasePositionLogs = await provider.getLogs(filter);
    lastExecutedBlock = currentBlockNumber;

    if (!decreasePositionLogs) return findings; // getLogs return undefined if result is empty
    const accountToClosings: Map<string, number> = new Map();

    decreasePositionLogs.forEach((log: Log) => {
      const currentEvent = utils.EVENTS_IFACE.decodeEventLog(utils.DECREASE_POSITION_EVENT, log.data, log.topics);
      const noOfClosing = accountToClosings.get(currentEvent[1]);
      accountToClosings.set(currentEvent[1], noOfClosing ? noOfClosing + 1 : 1);
    });

    accountToClosings.forEach((noOfClosing, account) => {
      if (noOfClosing >= networkManager.get("threshold")) {
        findings.push(utils.createFinding(account, noOfClosing.toString()));
      }
    });

    return findings;
  };

export default {
  initialize: provideInitialize(utils.provider),
  handleBlock: provideHandleBlock(networkManager, utils.provider),
};
