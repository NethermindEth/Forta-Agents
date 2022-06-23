import { Finding, HandleBlock, BlockEvent, getEthersProvider } from "forta-agent";
import { providers, utils, Contract } from "ethers";
import { BigNumber } from "bignumber.js";
import { NetworkManager } from "forta-agent-tools";
import { createFinding, NetworkData, SmartCaller, toBn } from "./utils";
import { EVENT, TOKEN_ABI } from "./constants";
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
  networkManager: NetworkManager<NetworkData>
): HandleBlock => {
  const vaultIface = new utils.Interface(EVENT);

  const topics = [vaultIface.getEventTopic("PoolBalanceChanged")];

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = (
      await provider.getLogs({
        address: networkManager.get("vaultAddress"),
        topics,
        fromBlock: blockEvent.blockNumber,
        toBlock: blockEvent.blockNumber,
      })
    ).map((el) => vaultIface.parseLog(el));

    const vaultContract = new Contract(networkManager.get("vaultAddress"), new utils.Interface(TOKEN_ABI), provider);

    await Promise.all(
      logs.map(async (log) => {
        const { poolId, tokens, deltas } = log.args;

        const poolTokens = SmartCaller.from(vaultContract);

        const poolTokensInfo = await poolTokens.getPoolTokens(poolId, {
          blockTag: blockEvent.blockNumber,
        });

        for (let i = 0; i < tokens.length; i++) {
          const delta = toBn(deltas[i]);
          const previousBalance = toBn(poolTokensInfo[1][i]).minus(delta);

          const _threshold = previousBalance.multipliedBy(networkManager.get("threshold")).dividedBy(100);

          if (!previousBalance.lte(0.1) && delta.abs().gte(_threshold)) {
            const data = {
              poolId,
              previousBalance,
              token: tokens[i],
              delta,
              percentage: delta.abs().multipliedBy(100).dividedBy(previousBalance),
            };

            findings.push(createFinding(data));
          }
        }
      })
    );

    return findings;
  };
};

export default {
  initialize: initialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(getEthersProvider(), networkManager),
};
