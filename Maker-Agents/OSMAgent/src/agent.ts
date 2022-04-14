import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import provideDenyFunctionHandler from "./deny.function";
import provideRelyFunctionHandler from "./rely.function";
import provideBigQueuedPriceDeviationHandler from "./big.queued.price.deviation";
import providePriceUpdateCheckHandler from "./price.update.check";
import AddressesFetcher from "./addresses.fetcher";
import axios from "axios";

const API_ENDPOINT: string = "https://changelog.makerdao.com/releases/mainnet/1.9.10/contracts.json";
const ELAPSED_TIME_BETWEEN_UPDATES: number = 86400; // one day

export const provideAgentHandler = (
  fetcher: AddressesFetcher,
): HandleTransaction => {
  const bigDeviationNextPriceHandler: HandleTransaction =
    provideBigQueuedPriceDeviationHandler(fetcher);
  const denyFunctionHandler: HandleTransaction =
    provideDenyFunctionHandler(fetcher);
  const relyFunctionHandler: HandleTransaction =
    provideRelyFunctionHandler(fetcher);
  const priceUpdateCheckHandler: HandleTransaction =
    providePriceUpdateCheckHandler();

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
  handleTransaction: provideAgentHandler(new AddressesFetcher(
    API_ENDPOINT,
    axios,
    ELAPSED_TIME_BETWEEN_UPDATES,
  )),
};
