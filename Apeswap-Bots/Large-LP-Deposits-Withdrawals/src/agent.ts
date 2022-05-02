import { Finding, HandleTransaction, TransactionEvent, LogDescription, getEthersProvider } from "forta-agent";
import PoolFetcher from "./pool.fetcher";
import { BigNumber, providers } from "ethers";
import utils from "./utils";

export const initialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();

  const APESWAP_FACTORY =
    chainId === 137 ? "0xCf083Be4164828f00cAE704EC15a36D711491284" : "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6";
  const INIT_CODE =
    chainId === 137
      ? "0x511f0f358fe530cda0859ec20becf391718fdf5a329be02f4c95361f3d6a42d8"
      : "0xf4ccce374816856d11f00e4069e7cada164065686fbef53c6167a63ec2fd8c5b";

  utils.initialized.push(APESWAP_FACTORY, INIT_CODE);
};

export const provideHandleTransaction =
  (
    getPair: any,
    fetcher: PoolFetcher,
    poolSupplyThreshold: BigNumber,
    amountThresholdPercentage: BigNumber
  ): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const block: number = txEvent.blockNumber;
    const logs: LogDescription[] = txEvent.filterLog(utils.EVENTS_ABI);

    await Promise.all(
      logs.map(async (log) => {
        const [valid, token0, token1, totalSupply] = await fetcher.getPoolData(block - 1, log.address);
        if (valid && log.address === getPair(token0, token1)) {
          const [balance0, balance1] = await fetcher.getPoolBalance(block - 1, log.address, token0, token1);
          if (
            totalSupply.gt(poolSupplyThreshold) &&
            (log.args.amount0.mul(100).gt(balance0.mul(amountThresholdPercentage)) ||
              log.args.amount1.mul(100).gt(balance1.mul(amountThresholdPercentage)))
          ) {
            findings.push(utils.createFinding(log, token0, token1));
          }
        }
      })
    );

    return findings;
  };

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(
    utils.apePairCreate2,
    new PoolFetcher(getEthersProvider()),
    utils.POOL_SUPPLY_THRESHOLD,
    utils.AMOUNT_THRESHOLD_PERCENTAGE
  ),
};
