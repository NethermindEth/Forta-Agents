import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { providers, BigNumber } from "ethers";
import NetworkManager from "./network";
import NetworkData from "./network";
import { SWAP_ABI, PAIR_ABI, create2Pair } from "./utils";
import { createFinding } from "./findings";
import { MulticallContract, MulticallProvider } from "./multicall2";

const THRESHOLD_PERCENTAGE: number = 20;

let networkManager: NetworkData;
let multicall2: MulticallProvider;

export const provideInitialize = (_networkManager: NetworkData, provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager = _networkManager;
  networkManager.setNetwork(chainId);
  multicall2 = new MulticallProvider(provider, networkManager.multicall2Data, chainId);
};

export function provideHandleTransaction(thresholdPercentage: number): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    await Promise.all(
      // Filter for any `Swap` event emissions
      txEvent.filterLog(SWAP_ABI).map(async (log) => {
        // Assign the `Swap` arguments to variables
        const [, amount0In, amount1In, amount0Out, amount1Out] = log.args;

        // Create pair contract at emitting address
        // and fetch `token0`, `token1`, and `reserves`
        const pairContract = new MulticallContract(log.address, PAIR_ABI);
        const results = await multicall2.all(
          [pairContract.token0(), pairContract.token1(), pairContract.getReserves()],
          txEvent.blockNumber - 1
        );
        if (results.some((el) => !el.success)) {
          return;
        }
        const [token0, token1, [reserve0, reserve1]] = results.map((el) => el.returnData);

        // Check if the emitting address is a valid pair contract
        // by comparing to `create2` output.
        const create2PairAddress: string = create2Pair(
          token0.toLowerCase(),
          token1.toLowerCase(),
          networkManager.factory,
          networkManager.pairInitCodeHash
        );
        if (create2PairAddress === log.address) {
          // Create threshold amounts
          const reserve0Threshold: BigNumber = reserve0.mul(thresholdPercentage).div(100);
          const reserve1Threshold: BigNumber = reserve1.mul(thresholdPercentage).div(100);
          // If the `amount` arguments from `Swap` are large relative
          // to their respective `reserve`, create a finding
          if (
            amount0In.gte(reserve0Threshold) ||
            amount0Out.gte(reserve0Threshold) ||
            amount1In.gte(reserve1Threshold) ||
            amount1Out.gte(reserve1Threshold)
          ) {
            findings.push(createFinding(log.args, log.address));
          }
        }
      })
    );
    return findings;
  };
}

export default {
  initialize: provideInitialize(new NetworkManager(), getEthersProvider()),
  handleTransaction: provideHandleTransaction(THRESHOLD_PERCENTAGE),
};
