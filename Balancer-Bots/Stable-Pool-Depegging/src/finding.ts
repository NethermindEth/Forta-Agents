import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";
import BigNumber from "bignumber.js";

export function createValueThresholdFinding(
  pool: string,
  startValue: ethers.BigNumber,
  endValue: ethers.BigNumber,
  poolName: string
): Finding {
  return Finding.from({
    name: `Low Stable Pool Amplification Parameter in ${poolName}`,
    description: `A low amplification parameter endValue (${endValue}) was detected in ${poolName}`,
    alertId: "BAL-9-1",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      pool,
      startValue: startValue.toString(),
      endValue: endValue.toString(),
    },
  });
}

export function createDecreaseThresholdFinding(
  pool: string,
  startValue: ethers.BigNumber,
  endValue: ethers.BigNumber,
  decrease: ethers.BigNumber,
  poolName: string
): Finding {
  return Finding.from({
    name: `High Stable Pool Amplification Parameter Decrease in ${poolName}`,
    description: `${poolName}'s amplification parameter will have a decrease by ${decrease}. The end value will be ${endValue.toString()}`,
    alertId: "BAL-9-2",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      pool,
      startValue: startValue.toString(),
      endValue: endValue.toString(),
      decrease: decrease.toString(),
    },
  });
}

export function createDecreasePercentageThresholdFinding(
  pool: string,
  startValue: ethers.BigNumber,
  endValue: ethers.BigNumber,
  decreasePercentage: BigNumber,
  poolName: string
): Finding {
  return Finding.from({
    name: `High Stable Pool Amplification Parameter Decrease in ${poolName}`,
    description: `${poolName}'s amplification parameter will have ${decreasePercentage
      .decimalPlaces(1)
      .toString(10)}% decrease. The end value will be ${endValue.toString()}`,
    alertId: "BAL-9-3",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      pool,
      startValue: startValue.toString(),
      endValue: endValue.toString(),
      decreasePercentage: decreasePercentage.toString(10),
    },
  });
}
