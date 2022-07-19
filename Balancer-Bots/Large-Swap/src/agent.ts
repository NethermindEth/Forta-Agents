import { ethers, Initialize, Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";
import { BigNumber } from "bignumber.js";
import { NetworkManager } from "forta-agent-tools";
import CONFIG from "./agent.config";
import { BALANCE_OF_ABI, SWAP_ABI } from "./constants";
import { NetworkData, SmartCaller, toBn } from "./utils";
import { createFinding } from "./finding";

BigNumber.set({ DECIMAL_PLACES: 18 });

const networkManager = new NetworkManager(CONFIG);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): HandleTransaction => {
  const tokenIface = new ethers.utils.Interface([BALANCE_OF_ABI]);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = txEvent.filterLog(SWAP_ABI, networkManager.get("vaultAddress"));

    await Promise.all(
      logs.map(async (log) => {
        const tokenIn = SmartCaller.from(new ethers.Contract(log.args.tokenIn, tokenIface, provider));
        const tokenOut = SmartCaller.from(new ethers.Contract(log.args.tokenOut, tokenIface, provider));

        const balanceTokenIn = toBn(
          await tokenIn.balanceOf(networkManager.get("vaultAddress"), { blockTag: txEvent.blockNumber - 1 })
        );
        const balanceTokenOut = toBn(
          await tokenOut.balanceOf(networkManager.get("vaultAddress"), { blockTag: txEvent.blockNumber - 1 })
        );

        const percentageTokenIn = toBn(log.args.amountIn).dividedBy(balanceTokenIn).shiftedBy(2);
        const percentageTokenOut = toBn(log.args.amountOut).dividedBy(balanceTokenOut).shiftedBy(2);

        const tvlPercentageThreshold = networkManager.get("tvlPercentageThreshold");
        if (percentageTokenIn.gte(tvlPercentageThreshold) || percentageTokenOut.gte(tvlPercentageThreshold)) {
          findings.push(createFinding(log, percentageTokenIn, percentageTokenOut));
        }
      })
    );

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager, getEthersProvider()),
};
