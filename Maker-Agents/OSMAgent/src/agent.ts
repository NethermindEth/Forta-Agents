import { Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";
import provideDenyFunctionHandler from "./deny.function";
import provideRelyFunctionHandler from "./rely.function";
import provideBigQueuedPriceDeviationHandler from "./big.queued.price.deviation";
import providePriceUpdateCheckHandler from "./price.update.check";
import AddressesFetcher from "./addresses.fetcher";
import { CHAIN_LOG, EVENTS_ABIS } from "./utils";

let FETCHER : AddressesFetcher = new AddressesFetcher(getEthersProvider(),CHAIN_LOG);

export const initialize = (fetcher: AddressesFetcher) => async ()=> {
// fetch OSM addresses from the ChainLog contract.
await fetcher.getOsmAddresses("latest");
}

export const provideAgentHandler = (fetcher: AddressesFetcher): HandleTransaction => {

  const bigDeviationNextPriceHandler: HandleTransaction = provideBigQueuedPriceDeviationHandler(fetcher);
  const denyFunctionHandler: HandleTransaction = provideDenyFunctionHandler(fetcher);
  const relyFunctionHandler: HandleTransaction = provideRelyFunctionHandler(fetcher);
  const priceUpdateCheckHandler: HandleTransaction = providePriceUpdateCheckHandler();

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    // Update the contracts list.
    txEvent.filterLog(EVENTS_ABIS,CHAIN_LOG).forEach((log) =>{
       fetcher.updateAddresses(log.name, log.args.flat())
    })

    findings = findings.concat(await bigDeviationNextPriceHandler(txEvent));
    findings = findings.concat(await denyFunctionHandler(txEvent));
    findings = findings.concat(await relyFunctionHandler(txEvent));
    findings = findings.concat(await priceUpdateCheckHandler(txEvent));

    return findings;
  };
};

export default {
  initialize: initialize(FETCHER),
  handleTransaction: provideAgentHandler(FETCHER),
};
