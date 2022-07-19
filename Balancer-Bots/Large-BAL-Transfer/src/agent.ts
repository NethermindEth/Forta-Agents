import { Finding, getEthersProvider, Initialize, HandleTransaction, TransactionEvent } from "forta-agent";
import { BigNumber } from "bignumber.js";
import { providers, Contract } from "ethers";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, SmartCaller, toBn } from "./utils";
import { EVENT, TOKEN_ABI } from "./constants";
import CONFIG from "./agent.config";
import { createFinding } from "./findings";

BigNumber.set({ DECIMAL_PLACES: 18 });

const networkManager = new NetworkManager<NetworkData>(CONFIG);

const provideInitialize = (networkManager: NetworkManager<NetworkData>, provider: providers.Provider): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction =
  (networkManager: NetworkManager<NetworkData>, provider: providers.Provider): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = txEvent.filterLog(EVENT, networkManager.get("balToken"));
    const balToken = SmartCaller.from(new Contract(networkManager.get("balToken"), TOKEN_ABI, provider));

    await Promise.all(
      logs.map(async (log) => {
        const { to, from, value } = log.args;

        const bnValue = toBn(value);

        const totalSupply = toBn(
          await balToken.totalSupply({
            blockTag: txEvent.blockNumber,
          })
        );

        const _threshold = totalSupply.multipliedBy(networkManager.get("threshold")).dividedBy(100);

        if (bnValue.gte(_threshold)) {
          const percentage = bnValue.multipliedBy(100).dividedBy(totalSupply);

          findings.push(createFinding(from, to, bnValue, percentage));
        }
      })
    );

    return findings;
  };

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager, getEthersProvider()),
};
