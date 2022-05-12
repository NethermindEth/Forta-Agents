import { Finding, HandleTransaction, TransactionEvent, LogDescription, getEthersProvider } from "forta-agent";
import PoolFetcher from "./pool.fetcher";
import { BigNumber, providers } from "ethers";
import utils from "./utils";
import NetworkData from "./network";
import NetworkManager from "./network";

const networkManager = new NetworkManager();

export const initialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideHandleTransaction =
  (
    data: NetworkData,
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
        if (valid && log.address === getPair(token0, token1, data)) {
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
    networkManager,
    utils.apePairCreate2,
    new PoolFetcher(getEthersProvider()),
    utils.POOL_SUPPLY_THRESHOLD,
    utils.AMOUNT_THRESHOLD_PERCENTAGE
  ),
};
