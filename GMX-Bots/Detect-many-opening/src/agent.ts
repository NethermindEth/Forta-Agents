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
    vaultAddress: string
  ): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const currentBlockNumber = txEvent.block.number;
    const filter = {
      fromBlock: currentBlockNumber - positionsNumber,
      toBlock: currentBlockNumber,
      address: vaultAddress,
      topics: [utils.EVENTS_IFACE.getEventTopic("IncreasePosition")],
    };

    const increasePositionLogs = await provider.getLogs(filter);

    if (!increasePositionLogs) return findings;

    let suspiciousAccount = "";
    increasePositionLogs.every((log: Log, index: number) => {
      if (increasePositionLogs.length - 1 === index) return;
      const currentEvent = utils.EVENTS_IFACE.decodeEventLog(
        "IncreasePosition",
        log.data,
        log.topics
      );
      const nextEvent = utils.EVENTS_IFACE.decodeEventLog(
        "IncreasePosition",
        increasePositionLogs[index + 1].data,
        increasePositionLogs[index + 1].topics
      );
      // event index number 1 is the account
      if (currentEvent[1] === nextEvent[1]) {
        suspiciousAccount = currentEvent[1];
        return true;
      }
      suspiciousAccount = "";
      return true;
    });

    if (suspiciousAccount.length > 0) {
      findings.push(utils.createFinding(suspiciousAccount));
    }

    return findings;
  };

export default {
  handleTransaction: handleTransaction(
    utils.provider,
    utils.positionsNumber,
    utils.GMX_VAULT_ADDRESS
  ),
};
