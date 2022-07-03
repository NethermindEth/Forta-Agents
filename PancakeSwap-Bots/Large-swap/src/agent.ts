import { Finding, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";

import { SWAP_EVENT, isValidPancakePair, getERC20Balance, LARGE_THRESHOLD, createFinding, toBn } from "./utils";
import BigNumber from "bignumber.js";

export const provideBotHandler = (largePercentage: string, provider: ethers.providers.Provider): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for swap events
    const swapEvents = txEvent.filterLog(SWAP_EVENT);

    try {
      await Promise.all(
        swapEvents.map(async (event) => {
          const pairAddress = event.address;
          const [isValid, token0Address, token1Address] = await isValidPancakePair(pairAddress, provider);
          if (isValid) {
            const token0Balance = await getERC20Balance(token0Address, pairAddress, provider, txEvent.blockNumber - 1);
            const token1Balance = await getERC20Balance(token1Address, pairAddress, provider, txEvent.blockNumber - 1);
            const amount0Out: BigNumber = toBn(event.args.amount0Out);
            const amount1Out: BigNumber = toBn(event.args.amount1Out);
            const amount0In: BigNumber = toBn(event.args.amount0In);
            const amount1In: BigNumber = toBn(event.args.amount1In);
            const to: string = event.args.to;
            if (amount0Out.gt(0)) {
              const percentageToken0Out = amount0Out.multipliedBy(100).dividedBy(token0Balance);
              const percentageToken1In = amount1In.multipliedBy(100).dividedBy(token1Balance);
              if (percentageToken0Out.gte(LARGE_THRESHOLD) || percentageToken1In.gte(LARGE_THRESHOLD)) {
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
              if (percentageToken1Out.gte(LARGE_THRESHOLD) || percentageToken0In.gte(LARGE_THRESHOLD)) {
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
                ); // createFinding
              }
            }
          }
        })
      );
    } catch (error) {
      throw new Error("error");
    }

    return findings;
  };
};

export default {
  //initialize: initialize(getEthersProvider()),
  handleTransaction: provideBotHandler(LARGE_THRESHOLD, getEthersProvider()),
};
