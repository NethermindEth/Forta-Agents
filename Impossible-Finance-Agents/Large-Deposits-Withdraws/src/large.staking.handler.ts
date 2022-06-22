import { BigNumber } from "ethers";
import { Finding, TransactionEvent } from "forta-agent";
import { createStakeFinding, IDIA_TOKEN, PERCENT, STAKE_ABI, UNSTAKE_ABI } from "./utils";
import StakeFetcher from "./stake.fetcher";

export const stakeHandler = async (
  stakingContract: string,
  txEvent: TransactionEvent,
  fetcher: StakeFetcher
): Promise<Finding[]> => {
  const findings: Finding[] = [];
  // Get stake/unstake events
  const stakingEvents = txEvent.filterLog([STAKE_ABI, UNSTAKE_ABI], stakingContract);
  if (stakingEvents.length === 0) return findings;
  // compute totalSupply of the token
  const totalSupply = await fetcher.getTotalSupply(IDIA_TOKEN, txEvent.blockNumber - 1);
  const threshold: BigNumber = BigNumber.from(PERCENT).mul(totalSupply).div(100);

  for (let i = 0; i < stakingEvents.length; i++) {
    if (threshold.lte(stakingEvents[i].args[2])) {
      findings.push(createStakeFinding(stakingEvents[i], "IMPOSSIBLE-4-1"));
    }
  }
  return findings;
};

export default {
  stakeHandler,
};
