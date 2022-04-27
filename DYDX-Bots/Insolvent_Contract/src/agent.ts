import { BlockEvent, Finding, HandleBlock, getEthersProvider } from "forta-agent";
import { BigNumber } from "ethers";
import BalanceFetcher from "./balance.fetcher";
import { PROXY_ADDRESS } from "./utils";
import { createFinding } from "./findings";

const BAL_FETCHER: BalanceFetcher = new BalanceFetcher(getEthersProvider(), PROXY_ADDRESS);

export function provideHandleBlock(fetcher: BalanceFetcher): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const totalBorrowerDebtBalance: BigNumber = await fetcher.getTotalBorrowerDebtBalance(blockEvent.blockNumber);
    const totalActiveBalanceCurrentEpoch: BigNumber = await fetcher.getTotalActiveBalanceCurrentEpoch(blockEvent.blockNumber);

    if (totalBorrowerDebtBalance.gte(totalActiveBalanceCurrentEpoch)) {
      findings.push(createFinding(totalBorrowerDebtBalance, totalActiveBalanceCurrentEpoch));
    }

    return findings;
  };
}

export default {
  handleBlock: provideHandleBlock(BAL_FETCHER),
};
