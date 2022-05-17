import {
  ethers,
  Finding,
  HandleTransaction,
  Log,
  TransactionEvent,
} from "forta-agent";

import utils from "./utils";

export const handleTransaction =
  (
    provider: ethers.providers.JsonRpcProvider,
    positionsNumber: number,
    blockNumbers: number,
    vaultAddress: string
  ): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const currentBlockNumber = txEvent.block.number;
    const filter = {
      fromBlock: currentBlockNumber - blockNumbers,
      toBlock: currentBlockNumber,
      address: vaultAddress,
      topics: [utils.EVENTS_IFACE.getEventTopic("IncreasePosition")],
    };

    const increasePositionLogs = await provider.getLogs(filter);

    if (!increasePositionLogs) return findings; // getLogs return undefined if result is empty

    const accountByNoOfOpening: Map<string, number> = new Map();

    increasePositionLogs.forEach((log: Log) => {
      const currentEvent = utils.EVENTS_IFACE.decodeEventLog(
        "IncreasePosition",
        log.data,
        log.topics
      );
      const accountNoOfOpening = accountByNoOfOpening.get(currentEvent[1]);
      if (accountNoOfOpening) {
        accountByNoOfOpening.set(currentEvent[1], accountNoOfOpening + 1);
      } else {
        accountByNoOfOpening.set(currentEvent[1], 1);
      }
    });

    accountByNoOfOpening.forEach((noOfOpening, account) => {
      if (noOfOpening >= positionsNumber) {
        findings.push(utils.createFinding(account,noOfOpening.toString()));
      }
    });

    return findings;
  };

export default {
  handleTransaction: handleTransaction(
    utils.provider,
    utils.positionsNumber,
    utils.blockNumbers,
    utils.GMX_VAULT_ADDRESS
  ),
};
