import { ethers, Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";
import BigNumber from "bignumber.js";
import { BALANCE_OF_ABI, BORROW_ABI, GET_RESERVE_DATA_ABI } from "./constants";
import { AgentConfig, createFinding, SmartCaller } from "./utils";
import CONFIG from "./agent.config";

BigNumber.set({ DECIMAL_PLACES: 18 });

export const provideHandleTransaction = (
  provider: ethers.providers.Provider,
  config: AgentConfig
): HandleTransaction => {
  const LendingPool = SmartCaller.from(
    new ethers.Contract(config.lendingPoolAddress, [GET_RESERVE_DATA_ABI], provider),
    {
      cacheByBlockTag: false,
    }
  );
  const threshold = new BigNumber(config.tvlPercentageThreshold);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const logs = txEvent.filterLog(BORROW_ABI, config.lendingPoolAddress);

    await Promise.all(
      logs.map(async (log) => {
        const { reserve, amount, user, onBehalfOf } = log.args;

        const { uTokenAddress } = await LendingPool.getReserveData(reserve, { blockTag: "latest" });
        const erc20Asset = SmartCaller.from(new ethers.Contract(reserve, [BALANCE_OF_ABI], provider));
        const tvl = await erc20Asset.balanceOf(uTokenAddress, { blockTag: txEvent.blockNumber - 1 });

        const percentage = new BigNumber(amount.toString()).div(new BigNumber(tvl.toString())).shiftedBy(2);

        if (percentage.gte(threshold)) {
          findings.push(createFinding(amount, percentage, user, onBehalfOf));
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
