import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { BigNumber } from "ethers";
import DataFetcher from "./data.fetcher";
import { createFinding } from "./utils";
import { SWAP_EVENT, LARGE_THRESHOLD, PANCAKE_FACTORY_ADDRESS, INIT_CODE_PAIR_HASH } from "./constants";

export const provideBotHandler = (
  largePercentage: BigNumber,
  pancakeFactory: string,
  fetcher: DataFetcher,
  initCode: string
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for swap events
    const swapEvents = txEvent.filterLog(SWAP_EVENT);
    await Promise.all(
      swapEvents.map(async (event) => {
        const pairAddress = event.address;
        const [isValid, token0Address, token1Address] = await fetcher.isValidPancakePair(
          pairAddress,
          txEvent.blockNumber,
          pancakeFactory,
          initCode
        );
        if (isValid) {
          const [token0Balance, token1Balance] = await Promise.all([
            fetcher.getERC20Balance(token0Address, pairAddress, txEvent.blockNumber - 1),
            fetcher.getERC20Balance(token1Address, pairAddress, txEvent.blockNumber - 1),
          ]);
          const amount0Out: BigNumber = BigNumber.from(event.args.amount0Out);
          const amount1Out: BigNumber = BigNumber.from(event.args.amount1Out);
          const amount0In: BigNumber = BigNumber.from(event.args.amount0In);
          const amount1In: BigNumber = BigNumber.from(event.args.amount1In);
          const to: string = event.args.to;
          if (amount0Out.gt(0)) {
            const percentageToken0Out = amount0Out.mul(100).div(token0Balance);
            const percentageToken1In = amount1In.mul(100).div(token1Balance);
            if (percentageToken0Out.gte(largePercentage) || percentageToken1In.gte(largePercentage)) {
              findings.push(
                createFinding(
                  pairAddress,
                  token1Address,
                  token0Address,
                  amount1In,
                  amount0Out,
                  percentageToken1In,
                  percentageToken0Out,
                  to
                )
              );
            }
          }
          if (amount1Out.gt(0)) {
            const percentageToken1Out = amount1Out.mul(100).div(token1Balance);
            const percentageToken0In = amount0In.mul(100).div(token0Balance);
            if (percentageToken1Out.gte(largePercentage) || percentageToken0In.gte(largePercentage)) {
              findings.push(
                createFinding(
                  pairAddress,
                  token0Address,
                  token1Address,
                  amount0In,
                  amount1Out,
                  percentageToken0In,
                  percentageToken1Out,
                  to
                )
              );
            }
          }
        }
      })
    );

    return findings;
  };
};

export default {
  handleTransaction: provideBotHandler(
    LARGE_THRESHOLD,
    PANCAKE_FACTORY_ADDRESS,
    new DataFetcher(getEthersProvider()),
    INIT_CODE_PAIR_HASH
  ),
};
