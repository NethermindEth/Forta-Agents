import { Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";
import { createFinding } from "./findings.helper";
import { providers } from "ethers";
import { HUBPOOL_EVENTS } from "./utils";
import TokenBalanceHelper from "./token.balance.helper";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);
const balanceFetcher: TokenBalanceHelper = new TokenBalanceHelper(getEthersProvider(), networkManager);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export function provideHandleTransaction(
  balanceFetcher: TokenBalanceHelper,
  networkManager: NetworkManager
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const hubPoolEvent = txEvent.filterLog(HUBPOOL_EVENTS, networkManager.hubPoolAddress);

    for (const liquidityEvent of hubPoolEvent) {
      let [l1Token] = liquidityEvent.args;

      const [oldBalance, newBalance] = await balanceFetcher.getBalanceOf(txEvent.blockNumber, l1Token);

      if (liquidityEvent.name === "LiquidityAdded") {
        if (newBalance.lt(oldBalance)) {
          findings.push(createFinding(liquidityEvent.name, l1Token, oldBalance, newBalance, true));
          continue;
        }
      } else if (liquidityEvent.name === "LiquidityRemoved") {
        if (newBalance.gt(oldBalance)) {
          findings.push(createFinding(liquidityEvent.name, l1Token, oldBalance, newBalance, true));
          continue;
        }
      }

      findings.push(createFinding(liquidityEvent.name, l1Token, oldBalance, newBalance));
    }
    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(balanceFetcher, networkManager),
};
