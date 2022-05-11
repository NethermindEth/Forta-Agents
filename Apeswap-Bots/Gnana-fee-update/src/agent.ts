import {
  Finding,
  HandleTransaction,
  LogDescription,
  TransactionEvent,
} from "forta-agent";

import utils from "./utils";

export const handleTransaction =
  (gnanaTokenAddress: string): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const updateTaxLogs = txEvent.filterLog(
      utils.EVENT_ABI,
      gnanaTokenAddress
    );

    updateTaxLogs.forEach((log: LogDescription) => {
      findings.push(
        utils.createFinding({
          previousFee: log.args.previousTaxFee.toString(),
          currentFee: log.args.newTaxFee.toString(),
        })
      );
    });

    return findings;
  };

export default {
  handleTransaction: handleTransaction(utils.GNANA_TOKEN_ADDRESS),
};
