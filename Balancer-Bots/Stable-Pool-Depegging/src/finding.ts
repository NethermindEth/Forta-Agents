import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";
import BigNumber from "bignumber.js";

export function createValueThresholdFinding(pool: string, endValue: ethers.BigNumber): Finding {
  return Finding.from({
    name: "Low Stable Pool Amplification Parameter",
    description: "A low amplification parameter endValue was detected in a stable pool",
    alertId: "BAL-9-1",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      pool,
      endValue: endValue.toString(),
    },
  });
}

export function createDecreaseThresholdFinding(
  pool: string,
  endValue: ethers.BigNumber,
  decrease: ethers.BigNumber
): Finding {
  return Finding.from({
    name: "High Stable Pool Amplification Parameter Decrease",
    description: "A stable pool amplification parameter will have a significant decrease",
    alertId: "BAL-9-2",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      pool,
      endValue: endValue.toString(),
      decrease: decrease.toString(),
    },
  });
}

export function createDecreasePercentageThresholdFinding(
  pool: string,
  endValue: ethers.BigNumber,
  decreasePercentage: BigNumber
): Finding {
  return Finding.from({
    name: "High Stable Pool Amplification Parameter Decrease",
    description: "A stable pool amplification parameter will have a significant decrease in percentage",
    alertId: "BAL-9-3",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      pool,
      endValue: endValue.toString(),
      decreasePercentage: decreasePercentage.toString(10),
    },
  });
}
