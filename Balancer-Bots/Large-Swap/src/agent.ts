import { BlockEvent, ethers, HandleBlock, Initialize, Finding, getEthersProvider } from "forta-agent";
import { BigNumber } from "bignumber.js";
import { NetworkManager } from "forta-agent-tools";
import CONFIG from "./agent.config";
import { BALANCE_OF_ABI, SWAP_ABI } from "./constants";
import { createFinding, NetworkData, SmartCaller, toBn } from "./utils";

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

export const provideHandleBlock = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): HandleBlock => {
  const vaultIface = new ethers.utils.Interface([SWAP_ABI]);
  const tokenIface = new ethers.utils.Interface([BALANCE_OF_ABI]);
  const topics = [vaultIface.getEventTopic("Swap")];

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

    await Promise.all(
      logs.map(async (log) => {
        const tokenIn = SmartCaller.from(new ethers.Contract(log.args.tokenIn, tokenIface, provider));
        const tokenOut = SmartCaller.from(new ethers.Contract(log.args.tokenOut, tokenIface, provider));

        const balanceTokenIn = toBn(
          await tokenIn.balanceOf(networkManager.get("vaultAddress"), { blockTag: blockEvent.blockNumber - 1 })
        );
        const balanceTokenOut = toBn(
          await tokenOut.balanceOf(networkManager.get("vaultAddress"), { blockTag: blockEvent.blockNumber - 1 })
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
  handleBlock: provideHandleBlock(networkManager, getEthersProvider()),
};
