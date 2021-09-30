import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import provideDenyFunctionHandler from "./deny.function";
import provideRelyFunctionHandler from "./rely.function";
import provideBigQueuedPriceDeviationHandler from "./big.queued.price.deviation";
import providePriceUpdateCheckHandler from "./price.update.check";
import { OSM_CONTRACTS } from "./utils";


export const provideAgentHandler = (oracleAddresses: string[]): HandleTransaction => {
  const bigDeviationNextPriceHandler: HandleTransaction = provideBigQueuedPriceDeviationHandler(
    oracleAddresses
  );
  const denyFunctionHandler: HandleTransaction = provideDenyFunctionHandler(oracleAddresses);
  const relyFunctionHandler: HandleTransaction = provideRelyFunctionHandler(oracleAddresses);
  const priceUpdateCheckHandler: HandleTransaction = providePriceUpdateCheckHandler();

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    findings = findings.concat(await bigDeviationNextPriceHandler(txEvent));
    findings = findings.concat(await denyFunctionHandler(txEvent));
    findings = findings.concat(await relyFunctionHandler(txEvent));
    findings = findings.concat(await priceUpdateCheckHandler(txEvent));

    return findings;
  };
};

export default {
  handleTransaction: provideAgentHandler(OSM_CONTRACTS)
};
