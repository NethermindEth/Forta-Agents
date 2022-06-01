import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import utils from "./utils";

export const handleTransaction =
  (timelockV2secure: string, timelockV2general: string): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const tV2SecureLogs = txEvent.filterLog(utils.EVENT_ABI, timelockV2secure);
    const tV2GeneralLogs = txEvent.filterLog(
      utils.EVENT_ABI,
      timelockV2general
    );

    tV2SecureLogs.forEach((log) => {
      findings.push(utils.createFinding(log, "TimelockV2Secure"));
    });

    tV2GeneralLogs.forEach((log) => {
      findings.push(utils.createFinding(log, "TimelockV2General"));
    });

    return findings;
  };

export default {
  handleTransaction: handleTransaction(
    utils.TIMELOCKV2_SECURE,
    utils.TIMELOCKV2_GENERAL
  ),
};
