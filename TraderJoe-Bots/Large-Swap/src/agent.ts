import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { providers, BigNumber } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";
import { SWAP_ABI, PAIR_IFACE, create2Pair, JOE_PAIR_INIT_CODE_HASH } from "./utils";
import MulticallFetcher from "./multicall.fetcher";
import { createFinding } from "./findings";

const THRESHOLD_PERCENTAGE: number = 20;

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export function provideHandleTransaction(
  provider: providers.Provider,
  /*signer: providers.JsonRpcSigner,*/
  networkManager: NetworkData,
  pairInitCodeHash: string, // *** NOTE: NEED TO GENERATE A KOVAN INIT CODE HASH
  thresholdPercentage: number
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    await Promise.all(
      // Filter for any `Swap` event emissions
      txEvent.filterLog(SWAP_ABI).map(async (log) => {
        // Assign the `Swap` arguments to variables
        const [, amount0In, amount1In, amount0Out, amount1Out] = log.args;

        // NOTE: CREATE FETCHER IN HANDLE TRANSACTION
        // OR OUTSIDE?
        const multiFetcher: MulticallFetcher = new MulticallFetcher(networkManager.multicall, provider /*, signer*/);

        // Generate calls to both `token0` and
        // `token1` to be called via `multicall`
        const tokenCalls: [string, string][] = [
          [log.address, PAIR_IFACE.encodeFunctionData("token0")],
          [log.address, PAIR_IFACE.encodeFunctionData("token1")],
        ];

        // Pull return data from `multicall`
        const [, tokenReturnData] = await multiFetcher.aggregate(tokenCalls, txEvent.blockNumber);
        // Pull tokens from Result output of decoding,
        // since Result is an array
        const [[token0], [token1]] = [
          PAIR_IFACE.decodeFunctionResult("token0", tokenReturnData[0]),
          PAIR_IFACE.decodeFunctionResult("token1", tokenReturnData[1]),
        ];

        // Check if the emitting address is a valid pair contract
        // by comapring to `create2` output
        // NOTE: CHECK WHEN IT IS NECESSARY TO .toLowerCase() TOKEN ADDRESSES
        const create2PairAddress: string = create2Pair(
          token0.toLowerCase(),
          token1.toLowerCase(),
          networkManager.factory,
          pairInitCodeHash
        );
        if (create2PairAddress === log.address) {
          // Generate calls to both `getReserves`
          // to be called via `multicall`
          const reservesCall: string[][] = [[log.address, PAIR_IFACE.encodeFunctionData("getReserves")]];

          // Pull return data from `multicall`
          const [, reservesReturnData] = await multiFetcher.aggregate(reservesCall, txEvent.blockNumber - 1);
          // Pull reserves from Result output of decoding,
          // since Result is an array
          const [reserve0, reserve1] = PAIR_IFACE.decodeFunctionResult("getReserves", reservesReturnData[0]);

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
  handleTransaction: provideHandleTransaction(
    getEthersProvider(),
    networkManager,
    JOE_PAIR_INIT_CODE_HASH,
    THRESHOLD_PERCENTAGE
  ),
};
