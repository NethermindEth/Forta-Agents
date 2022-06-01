import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { providers, BigNumber } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";
import { SWAP_ABI, create2Pair } from "./utils";
import PairFetcher from "./pair.fetcher";
import { createFinding } from "./findings";

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export function provideHandleTransaction(provider: providers.Provider, networkManager: NetworkData): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    await Promise.all(
      // Filter for any `Swap` event emissions
      txEvent.filterLog(SWAP_ABI).map(async (log) => {
        // Assign the `Swap` arguments to variables
        const [, amount0In, amount1In, amount0Out, amount1Out] = log.args;

        // Create a fetcher at the emitting address
        // and fetch `token0` and `token1` addresses
        const pairFetcher: PairFetcher = new PairFetcher(log.address, provider);
        const token0 = await pairFetcher.getToken0(txEvent.blockNumber);
        const token1 = await pairFetcher.getToken1(txEvent.blockNumber);

        // Check if the emitting address is the same as a CREATE2 calculated one.
        const create2PairAddress: string = create2Pair(token0, token1, networkManager.factory);
        if (create2PairAddress === log.address) {
          // Query the emitting address for the reserves
          const [reserve0, reserve1] = await pairFetcher.getReserves(txEvent.blockNumber - 1);

          // Create threshold amounts
          // (20% of each reserve)
          const reserve0Threshold: BigNumber = reserve0.mul(20).div(100);
          const reserve1Threshold: BigNumber = reserve1.mul(20).div(100);

          // If the `amount` arguments from `Swap` are large relative
          // to their respective `reserve`, create a finding
          if (
            amount0In.gte(reserve0Threshold) ||
            amount0Out.gte(reserve0Threshold) ||
            amount1In.gte(reserve1Threshold) ||
            amount1Out.gte(reserve1Threshold)
          ) {
            findings.push(createFinding(log.args));
          }
        }
      })
    );

    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(getEthersProvider(), networkManager),
};
