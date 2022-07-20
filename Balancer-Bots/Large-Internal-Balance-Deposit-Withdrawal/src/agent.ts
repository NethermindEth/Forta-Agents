import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { providers, utils } from "ethers";
import { BigNumber } from "bignumber.js";
import BalanceFetcher from "./balance.fetcher";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, toBn } from "./utils";
import { createFinding } from "./finding";
import { EVENT } from "./constants";
import CONFIG from "./agent.config";

BigNumber.set({ DECIMAL_PLACES: 18 });

const networkManager = new NetworkManager<NetworkData>(CONFIG);

export const initialize = (networkManager: NetworkManager<NetworkData>, provider: providers.Provider) => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (
  networkManager: NetworkManager<NetworkData>,
  balanceFetcher: BalanceFetcher
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = txEvent.filterLog(EVENT, networkManager.get("vaultAddress"));

    await Promise.all(
      logs.map(async (log) => {
        const delta: BigNumber = toBn(log.args.delta);

        // fetch token balance of the contract then set threshold.
        const totalBalance: BigNumber = toBn(
          await balanceFetcher.getBalance(txEvent.blockNumber - 1, networkManager.get("vaultAddress"), log.args.token)
        );

        const _threshold = totalBalance.multipliedBy(networkManager.get("threshold")).dividedBy(100);

        if (delta.abs().gte(_threshold)) {
          const symbol: string = await balanceFetcher.getSymbol(txEvent.blockNumber - 1, log.args.token);

          const percentage = delta.abs().multipliedBy(100).dividedBy(totalBalance);

          findings.push(createFinding(log.args, percentage, symbol));
        }
      })
    );

    return findings;
  };
};

export default {
  initialize: initialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager, new BalanceFetcher(getEthersProvider())),
};
