import { Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";
import { createFinding } from "./findings.helper";
import { providers } from "ethers";
import { HUBPOOL_EVENTS } from "./utils";
import TokenBalanceHelper, { currentCycle } from "./token.balance.helper";
import { NetworkData, NetworkManagerData } from "./network";
import { NetworkManager } from "forta-agent-tools";
import LRU from "lru-cache";

const lruCache = new LRU<string, currentCycle>({ max: 10000 });
const networkManager = new NetworkManager(NetworkManagerData);
const balanceFetcher: TokenBalanceHelper = new TokenBalanceHelper(getEthersProvider(), networkManager);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export function provideHandleTransaction(
  balanceFetcher: TokenBalanceHelper,
  networkManager: NetworkManager<NetworkData>,
  lruCache: LRU<string, currentCycle>
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const hubPoolEvent = txEvent.filterLog(HUBPOOL_EVENTS, networkManager.get("hubPoolAddress"));

    for (const liquidityEvent of hubPoolEvent) {
      let [l1Token] = liquidityEvent.args;

      if (liquidityEvent.name === "LiquidityAdded") continue;

      if (liquidityEvent.name === "LiquidityRemoved") {
        const currentCycle = await balanceFetcher.getCurrentCycle(l1Token, txEvent.blockNumber, lruCache);

        if (txEvent.timestamp > currentCycle.cycleTimestamp + 86400) {
          await balanceFetcher.startNewCycle(l1Token, txEvent.blockNumber, txEvent.timestamp, lruCache);
          continue;
        }
        const calculatedCycle = await balanceFetcher.calculateChange(l1Token, txEvent.blockNumber, lruCache);

        if (calculatedCycle.percentChanged >= 0.1) {
          findings.push(createFinding(l1Token, calculatedCycle.initialAmount, calculatedCycle.newAmount));
        }
      }
    }
    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(balanceFetcher, networkManager, lruCache),
};
