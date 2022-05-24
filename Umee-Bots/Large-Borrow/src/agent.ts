import { ethers, Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";
import BigNumber from "bignumber.js";
import LRU from "lru-cache";
import { BALANCE_OF_ABI, BORROW_ABI, GET_RESERVE_DATA_ABI } from "./constants";
import { AgentConfig, createFinding } from "./utils";
import CONFIG from "./agent.config";

BigNumber.set({ DECIMAL_PLACES: 18 });

export const provideHandleTransaction = (
  provider: ethers.providers.Provider,
  config: AgentConfig
): HandleTransaction => {
  const LendingPool = new ethers.Contract(config.lendingPoolAddress, [GET_RESERVE_DATA_ABI], provider);
  const threshold = new BigNumber(config.tvlPercentageThreshold);
  const uTokenCache = new LRU<string, string>({ max: 500 });

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const logs = txEvent.filterLog(BORROW_ABI, config.lendingPoolAddress);

    await Promise.all(
      logs.map(async (log) => {
        const { reserve, amount } = log.args;

        if (!uTokenCache.has(reserve)) {
          uTokenCache.set(reserve, await LendingPool.getReserveData(reserve));
        }

        // since if has() returns false cache[reserve] is set, this is not undefined
        const uTokenAddress = uTokenCache.get(reserve)!;

        const erc20Asset = new ethers.Contract(uTokenAddress, [BALANCE_OF_ABI], provider);
        const tvl = await erc20Asset.balanceOf(uTokenAddress, { blockTag: txEvent.blockNumber - 1 });

        const percentage = new BigNumber(amount.toString()).div(new BigNumber(tvl.toString())).shiftedBy(2);

        if (percentage.gte(threshold)) {
          findings.push(createFinding(amount, percentage));
        }
      })
    );

    return findings;
  };
};

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(getEthersProvider(), CONFIG),
};
