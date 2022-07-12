import { Finding, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";

import {
  SWAP_EVENT,
  isValidPancakePair,
  getERC20Balance,
  LARGE_THRESHOLD,
  createFinding,
  toBn,
  PANCAKE_FACTORY_ADDRESS,
  INIT_CODE_PAIR_HASH,
} from "./utils";
import BigNumber from "bignumber.js";
BigNumber.set({ DECIMAL_PLACES: 18 });

export const provideBotHandler = (
  largePercentage: string,
  pancakeFactory: string,
  provider: ethers.providers.Provider,
  initCode: string
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for swap events
    const swapEvents = txEvent.filterLog(SWAP_EVENT);
      await Promise.all(
        swapEvents.map(async (event) => {
          const pairAddress = event.address;
          const [isValid, token0Address, token1Address] = await isValidPancakePair(
            pairAddress,
            provider,
            txEvent.blockNumber,
            pancakeFactory,
            initCode
          );
          if (isValid) {
            const [token0Balance, token1Balance] = await Promise.all([
              getERC20Balance(token0Address, pairAddress, provider, txEvent.blockNumber - 1),
              getERC20Balance(token1Address, pairAddress, provider, txEvent.blockNumber - 1)
            ]);
            const amount0Out: BigNumber = toBn(event.args.amount0Out);
            const amount1Out: BigNumber = toBn(event.args.amount1Out);
            const amount0In: BigNumber = toBn(event.args.amount0In);
            const amount1In: BigNumber = toBn(event.args.amount1In);
            const to: string = event.args.to;
            if (amount0Out.gt(0)) {
              const percentageToken0Out = amount0Out.multipliedBy(100).dividedBy(token0Balance);
              const percentageToken1In = amount1In.multipliedBy(100).dividedBy(token1Balance);
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
              const percentageToken1Out = amount1Out.multipliedBy(100).dividedBy(token1Balance);
              const percentageToken0In = amount0In.multipliedBy(100).dividedBy(token0Balance);
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
    getEthersProvider(),
    INIT_CODE_PAIR_HASH
  ),
};
