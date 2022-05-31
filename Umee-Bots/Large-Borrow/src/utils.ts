import BigNumber from "bignumber.js";
import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";

export interface AgentConfig {
  lendingPoolAddress: string;
  tvlPercentageThreshold: string;
}

export function createFinding(
  amount: ethers.BigNumber,
  tvlPercentage: BigNumber,
  user: string,
  onBehalfOf: string
): Finding {
  return Finding.from({
    alertId: "UMEE-6",
    name: "Large borrow",
    description: "There was a large borrow based on the pool's TVL",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    protocol: "Umee",
    metadata: {
      amount: amount.toString(),
      tvlPercentage: tvlPercentage.toString(10),
      user: user.toLowerCase(),
      onBehalfOf: onBehalfOf.toLowerCase(),
    },
  });
}
