import { BlockEvent, Finding, HandleBlock, getEthersProvider } from "forta-agent";
import { BigNumber } from "ethers";
import BalanceFetcher from "./balance.fetcher";
import { PROXY_ADDRESS, THRESHOLD_AMOUNT } from "./utils";
import { createFinding } from "./findings";

const BAL_FETCHER: BalanceFetcher = new BalanceFetcher(getEthersProvider(), PROXY_ADDRESS);

export function provideHandleBlock(fetcher: BalanceFetcher, threshold: BigNumber): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const [totalBorrowerDebtBalance, totalActiveBalanceCurrentEpoch] = await Promise.all([
      fetcher.getTotalBorrowerDebtBalance(blockEvent.blockNumber),
      fetcher.getTotalActiveBalanceCurrentEpoch(blockEvent.blockNumber),
    ]);

    // If the difference between `totalBorrowerDebtBalance` and `totalActiveBalanceCurrentEpoch`
    // is greater than the static threshold, create a finding
    if (threshold.lt(totalBorrowerDebtBalance.sub(totalActiveBalanceCurrentEpoch))) {
      findings.push(createFinding(totalBorrowerDebtBalance, totalActiveBalanceCurrentEpoch));
    }

    return findings;
  };
}

export default {
  handleBlock: provideHandleBlock(BAL_FETCHER, THRESHOLD_AMOUNT),
};
