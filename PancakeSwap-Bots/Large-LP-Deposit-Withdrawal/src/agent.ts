import { BigNumber, utils } from "ethers";
import { Finding, HandleTransaction, TransactionEvent, LogDescription, getEthersProvider } from "forta-agent";
import { EVENTS_ABI, POOL_SUPPLY_THRESHOLD, THRESHOLD_PERCENTAGE, FACTORY } from "./constants";
import { createPair, createFinding } from "./utils";
import PoolFetcher from "./pool.fetcher";

export const provideHandleTransaction =
  (
    createPair: any,
    fetcher: PoolFetcher,
    poolSupplyThreshold: BigNumber,
    thresholdPercentage: BigNumber,
    factory: string
  ): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const block: number = txEvent.blockNumber;
    const logs: LogDescription[] = txEvent.filterLog(EVENTS_ABI);
    if (!logs) return findings;

    await Promise.all(
      logs.map(async (log) => {
        const { amount0, amount1 } = log.args;
        const [valid, tokenA, tokenB, totalSupply] = await fetcher.getPoolData(block - 1, log.address);
        let token0: string = tokenA < tokenB ? tokenA : tokenB;
        let token1: string = tokenA < tokenB ? tokenB : tokenA;
        const createdPair = createPair(token0, token1, factory);

        if (valid && log.address === createdPair) {
          const [balance0, balance1] = await fetcher.getPoolBalance(block - 1, log.address, token0, token1);

          console.log("balance 0____", utils.formatEther(balance0));
          console.log("balance 1___", utils.formatEther(balance1));

          console.log("pool supply threshold____", poolSupplyThreshold.toString());
          console.log("amount 0__", utils.formatEther(amount0));
          console.log("amount 1__", utils.formatEther(amount1));
          if (
            totalSupply.gt(poolSupplyThreshold) &&
            (amount0.mul(100).gt(balance0.mul(thresholdPercentage)) ||
              amount1.mul(100).gt(balance1.mul(thresholdPercentage)))
          ) {
            findings.push(createFinding(log, token0, token1, totalSupply));
          }
        }
      })
    );

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(
    createPair,
    new PoolFetcher(getEthersProvider()),
    POOL_SUPPLY_THRESHOLD,
    THRESHOLD_PERCENTAGE,
    FACTORY
  ),
};
