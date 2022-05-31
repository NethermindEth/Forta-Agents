import { getEthersProvider } from "forta-agent";
import { HandleTransaction, TransactionEvent, Finding } from "forta-agent";
import { createFinding } from "./finding";
import MarketsFetcher from "./markets.fetcher";
import NetworkData from "./network";
import { FUNCTIONS_ABIS, MARKET_UPDATE_ABIS } from "./utils";

let networkManager = new NetworkData();
let marketsFetcher = new MarketsFetcher(getEthersProvider());

const provideInitialize = (marketsFetcher: MarketsFetcher) => async () => {
  const { chainId } = await marketsFetcher.provider.getNetwork();
  networkManager.setNetwork(chainId);

  // set joeTroller contract address
  marketsFetcher.setJoeTrollerContract(networkManager.joeTroller);
  // get all Markets from joeTroller
  await marketsFetcher.getMarkets("latest");
};

export const provideHandleTransaction =
  (networkManager: NetworkData, marketsFetcher: MarketsFetcher): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    // Update the markets list.
    txEvent.filterLog(MARKET_UPDATE_ABIS, networkManager.joeTroller).forEach((log) => {
      marketsFetcher.updateMarkets(log.name, log.args.jToken.toString());
    });
    const monitoredContracts = [
      Array.from(marketsFetcher.markets),
      networkManager.sJoeStaking,
      networkManager.masterChefV2,
      networkManager.moneyMaker,
    ].flat();
    // listen to functions calls.
    const sighashes = txEvent.filterFunction(FUNCTIONS_ABIS, monitoredContracts).map((call) => call.sighash);

    if (sighashes.length > 0) {
      for (let i = 0; i < txEvent.traces.length; i++) {
        const selector = (txEvent.traces[i].action.input || "").slice(0, 10); // "0x" and first 4 bytes
        // If the trace is the call for our function, look into sub-traces.

        if (monitoredContracts.includes(txEvent.traces[i].action.to) && sighashes.includes(selector)) {
          const depth = txEvent.traces[i].traceAddress.length;
          // Loop over sub-traces.
          let j;
          for (j = i + 1; j < txEvent.traces.length; j++) {
            if (txEvent.traces[j].traceAddress.length <= depth) {
              break; // subtree ended, non reentrant call
            }
            // check if a call to the same contract happened in sub-traces.
            if (txEvent.traces[j].action.to === txEvent.traces[i].action.to) {
              const reEntrantSelector = (txEvent.traces[j].action.input || "").slice(0, 10);
              // create a finding
              // initial call + the re-entrant call sighash
              findings.push(
                createFinding(txEvent.traces[i].action.to, txEvent.traces[i].action.from, selector, reEntrantSelector)
              );
            }
          }
          i = j - 1;
        }
      }
    }
    return findings;
  };

export default {
  initialize: provideInitialize(marketsFetcher),
  handleTransaction: provideHandleTransaction(networkManager, marketsFetcher),
};
