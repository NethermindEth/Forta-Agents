import {
  ethers,
  Finding,
  HandleTransaction,
  LogDescription,
  TransactionEvent,
} from "forta-agent";
import utils from "./utils";

export const handleTransaction =
  (
    reflectTokenAddress: string,
    provider: ethers.providers.Provider
  ): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const updateTaxAndTransferLogs = txEvent.filterLog(
      utils.EVENT_ABI,
      reflectTokenAddress
    );

    if (!updateTaxAndTransferLogs.length) return findings;

    updateTaxAndTransferLogs.forEach((log: LogDescription) => {
      const { name } = log;

      // In case owner updated the gas fees by updateTaxFee transaction
      if (utils.EVENTS_NAME.UpdateTaxFee === name) {
        findings.push(
          utils.createFinding({
            feeType: "tax",
            previousFee: log.args.previousTaxFee.toString(),
            currentFee: log.args.newTaxFee.toString(),
          })
        );
      }

      // In case user transfer token the reflect token amount decrease so the reflect rate change
      if (utils.EVENTS_NAME.Transfer.toString() === name) {
        findings.push(
          utils.createFinding({
            feeType: "reflect",
            previousFee: log.args.value.toString(),
            currentFee: log.args.value.toString(),
          })
        );
      }
    });

    return findings;
  };

export default {
  handleTransaction: handleTransaction(
    utils.REFLECT_TOKEN_ADDRESS,
    utils.provider
  ),
};
