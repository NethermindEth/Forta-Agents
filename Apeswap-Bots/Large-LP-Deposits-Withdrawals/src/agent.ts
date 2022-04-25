import { Finding, HandleTransaction, TransactionEvent, LogDescription, getEthersProvider } from "forta-agent";
import PoolFetcher from "./pool.fetcher";
import { BigNumber } from "ethers";
import utils from "./utils";

export const provideHandleTransaction =
  (fetcher: PoolFetcher, poolSupplyThreshold: BigNumber, amountThresholdPercentage: BigNumber): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const block: number = txEvent.blockNumber;
    const logs: LogDescription[] = txEvent.filterLog(utils.EVENTS_ABI);

    await Promise.all(
      logs.map(async (log) => {
        try {
          const [valid, token0, token1, totalSupply] = await fetcher.getPoolData(block - 1, log.address);
          if (valid && log.address === utils.apePaircreate2(token0, token1)) {
            const [balance0, balance1] = await fetcher.getPoolBalance(block - 1, log.address, token0, token1);
            if (
              totalSupply.gt(poolSupplyThreshold) &&
              log.args.amount0.mul(100).gt(balance0.mul(amountThresholdPercentage)) |
                log.args.amount1.mul(100).gt(balance1.mul(amountThresholdPercentage))
            ) {
              findings.push(utils.createFinding(log, token0, token1));
            }
          }
        } catch (err) {}
      })
    );

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(
    new PoolFetcher(getEthersProvider()),
    utils.POOL_SUPPLY_THRESHOLD,
    utils.AMOUNT_THRESHOLD_PERCENTAGE
  ),
};
