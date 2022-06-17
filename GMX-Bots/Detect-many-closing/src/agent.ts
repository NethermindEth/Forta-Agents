import { NetworkData, networkData } from "./network";
import { ethers, Finding, getEthersProvider, HandleTransaction, Log, TransactionEvent } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";

import utils from "./utils";

const networkManager = new NetworkManager(networkData);

export const provideInitialize = () => {
  return async () => {
    const provider = getEthersProvider();
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction =
  (networkManager: NetworkManager<NetworkData>, provider: ethers.providers.JsonRpcProvider): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const currentBlockNumber = txEvent.block.number;
    const filter = {
      fromBlock: currentBlockNumber - networkManager.get("blockNumber"),
      toBlock: currentBlockNumber,
      address: networkManager.get("address"),
      topics: [utils.EVENTS_IFACE.getEventTopic(utils.DECREASE_POSITION_EVENT)],
    };

    const decreasePositionLogs = await provider.getLogs(filter);

    if (!decreasePositionLogs) return findings; // getLogs return undefined if result is empty

    const accountByNoOfClosing: Map<string, number> = new Map();

    decreasePositionLogs.forEach((log: Log) => {
      const currentEvent = utils.EVENTS_IFACE.decodeEventLog(utils.DECREASE_POSITION_EVENT, log.data, log.topics);
      const noOfClosing = accountByNoOfClosing.get(currentEvent[1]);
      if (noOfClosing) {
        accountByNoOfClosing.set(currentEvent[1], noOfClosing + 1);
      } else {
        accountByNoOfClosing.set(currentEvent[1], 1);
      }
    });

    accountByNoOfClosing.forEach((noOfClosing, account) => {
      if (noOfClosing >= networkManager.get("positionsNumber")) {
        findings.push(utils.createFinding(account, noOfClosing.toString()));
      }
    });

    return findings;
  };

export default {
  initialize: provideInitialize(),
  handleTransaction: provideHandleTransaction(networkManager, utils.provider),
};
