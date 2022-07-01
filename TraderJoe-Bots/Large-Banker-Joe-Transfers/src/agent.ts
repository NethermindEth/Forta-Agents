import { BigNumber } from "ethers";
import { getEthersProvider, LogDescription } from "forta-agent";
import { HandleTransaction, TransactionEvent, Finding } from "forta-agent";
import { createFinding } from "./finding";
import MarketsFetcher from "./markets.fetcher";
import NetworkData from "./network";
import SupplyFetcher from "./supply.fetcher";
import { EVENTS_ABIS, MARKET_UPDATE_ABIS, PERCENTAGE } from "./utils";

const networkManager = new NetworkData();
const marketsFetcher = new MarketsFetcher(getEthersProvider());
const supplyFetcher = new SupplyFetcher(getEthersProvider());

const provideInitialize = (marketsFetcher: MarketsFetcher) => async () => {
  const { chainId } = await marketsFetcher.provider.getNetwork();
  networkManager.setNetwork(chainId);

  // set joeTroller contract address
  marketsFetcher.setJoeTrollerContract(networkManager.joeTroller);

  // fetch Markets from joeTroller
  await marketsFetcher.getMarkets("latest");
};

export const provideHandleTransaction =
  (
    networkManager: NetworkData,
    marketsFetcher: MarketsFetcher,
    supplyFetcher: SupplyFetcher
  ): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // Update the markets list.
    txEvent
      .filterLog(MARKET_UPDATE_ABIS, networkManager.joeTroller)
      .forEach((log) => {
        marketsFetcher.updateMarkets(log.name, log.args.jToken.toString());
      });

    // Listen to `Mint`, `Redeem` and `Borrow` events on jToken contracts.
    const logs: LogDescription[] = txEvent.filterLog(
      EVENTS_ABIS,
      Array.from(marketsFetcher.markets)
    );
    // fetch totalSupply for included markets.
    const supplies = await Promise.all(
      logs.map((log) =>
        supplyFetcher.getTotalSupply(log.address, txEvent.blockNumber - 1)
      )
    );

    for (let i = 0; i < logs.length; i++) {
      // set threshold
      const threshold = supplies[i].mul(PERCENTAGE).div(100);

      if (BigNumber.from(logs[i].args.tokensAmount).gte(threshold)) {
        findings.push(
          createFinding(logs[i].name, logs[i].address, Array.from(logs[i].args))
        );
      }
    }
    return findings;
  };

export default {
  initialize: provideInitialize(marketsFetcher),
  handleTransaction: provideHandleTransaction(
    networkManager,
    marketsFetcher,
    supplyFetcher
  ),
};
