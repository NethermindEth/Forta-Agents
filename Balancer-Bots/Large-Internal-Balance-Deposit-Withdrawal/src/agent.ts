import { Finding, HandleBlock, BlockEvent, getEthersProvider } from "forta-agent";
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

export const provideHandleBlock = (
  provider: providers.Provider,
  networkManager: NetworkManager<NetworkData>,
  balanceFetcher: BalanceFetcher
): HandleBlock => {
  const vaultIface = new utils.Interface(EVENT);

  const topics = [vaultIface.getEventTopic("InternalBalanceChanged")];

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = (
      await provider.getLogs({
        address: networkManager.get("vaultAddress"),
        topics,
        fromBlock: blockEvent.blockNumber,
        toBlock: blockEvent.blockNumber,
      })
    ).map((log) => vaultIface.parseLog(log));

    await Promise.all(
      logs.map(async (log) => {
        const delta: BigNumber = toBn(log.args.delta);

        // fetch token balance of the contract then set threshold.
        const totalBalance: BigNumber = toBn(
          await balanceFetcher.getBalance(
            blockEvent.blockNumber - 1,
            networkManager.get("vaultAddress"),
            log.args.token
          )
        );

        const _threshold = totalBalance.multipliedBy(networkManager.get("threshold")).dividedBy(100);

        if (delta.abs().gte(_threshold)) {
          const percentage = delta.abs().multipliedBy(100).dividedBy(totalBalance);

          findings.push(createFinding(log.args, percentage));
        }
      })
    );

    return findings;
  };
};

export default {
  initialize: initialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(getEthersProvider(), networkManager, new BalanceFetcher(getEthersProvider())),
};
