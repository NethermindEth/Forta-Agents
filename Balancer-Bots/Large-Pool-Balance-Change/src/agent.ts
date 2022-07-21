import { Finding, HandleTransaction, TransactionEvent, getEthersProvider, Initialize } from "forta-agent";
import { providers, utils, Contract } from "ethers";
import { BigNumber } from "bignumber.js";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, SmartCaller, toBn } from "./utils";
import { createFinding } from "./finding";
import { EVENT, TOKEN_ABI } from "./constants";
import CONFIG from "./agent.config";

BigNumber.set({ DECIMAL_PLACES: 18 });

const networkManager = new NetworkManager<NetworkData>(CONFIG);

const provideInitialize = (networkManager: NetworkManager<NetworkData>, provider: providers.Provider): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleBlock = (
  networkManager: NetworkManager<NetworkData>,
  provider: providers.Provider
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = txEvent.filterLog(EVENT, networkManager.get("vaultAddress"));

    const vaultContract = new Contract(networkManager.get("vaultAddress"), new utils.Interface(TOKEN_ABI), provider);

    await Promise.all(
      logs.map(async (log) => {
        const { poolId, tokens, deltas } = log.args;

        const poolTokens = SmartCaller.from(vaultContract);

        const poolTokensInfo = await poolTokens.getPoolTokens(poolId, {
          blockTag: txEvent.blockNumber,
        });

        for (let i = 0; i < tokens.length; i++) {
          const delta = toBn(deltas[i]);
          const previousBalance = toBn(poolTokensInfo[1][i]).minus(delta);

          const _threshold = previousBalance.multipliedBy(networkManager.get("threshold")).dividedBy(100);

          if (!previousBalance.lte(0.1) && delta.abs().gte(_threshold)) {
            const tokenContract = new Contract(tokens[i], new utils.Interface(TOKEN_ABI), provider);
            const token = SmartCaller.from(tokenContract);
            const tokenSymbol = await token.symbol({ blockTag: txEvent.blockNumber });

            const data = {
              poolId,
              previousBalance,
              token: tokens[i],
              delta,
              tokenSymbol,
              percentage: delta.abs().multipliedBy(100).dividedBy(previousBalance).decimalPlaces(1),
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
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleBlock(networkManager, getEthersProvider()),
};
