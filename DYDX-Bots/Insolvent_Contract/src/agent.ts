import { BlockEvent, Finding, HandleBlock, getEthersProvider } from "forta-agent";
import { BigNumber } from "ethers";
import BalanceFetcher from "./balance.fetcher";
import { PROXY_ADDRESS } from "./utils";
import { createFinding } from "./findings";

const BAL_FETCHER: BalanceFetcher = new BalanceFetcher(getEthersProvider(), PROXY_ADDRESS);

export function provideHandleBlock(fetcher: BalanceFetcher): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    let totalBorrowerDebtBalance: BigNumber;
    let totalActiveBalanceCurrentEpoch: BigNumber;

    await Promise.all([
      totalBorrowerDebtBalance = await fetcher.getTotalBorrowerDebtBalance(blockEvent.blockNumber),
      totalActiveBalanceCurrentEpoch = await fetcher.getTotalActiveBalanceCurrentEpoch(
        blockEvent.blockNumber
      )
    ]);

    if (totalBorrowerDebtBalance.gt(totalActiveBalanceCurrentEpoch)) {
      findings.push(createFinding(totalBorrowerDebtBalance, totalActiveBalanceCurrentEpoch));
    }

    return findings;
  };
}

export default {
  handleBlock: provideHandleBlock(BAL_FETCHER),
};
