import BigNumber from "bignumber.js";
import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";

export interface AgentConfig {
  ignoreThreshold: string;
  healthFactorThreshold: string;
  upperThreshold: string;
  ethUsdFeedAddress: string;
  lendingPoolAddress: string;
}

export function createFinding(address: string, healthFactor: BigNumber, totalCollateralUsd: BigNumber): Finding {
  return Finding.from({
    alertId: "UMEE-1",
    name: "User close to liquidation",
    description: "An account with large collateral is close to being liquidated",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    protocol: "Umee",
    metadata: {
      address,
      healthFactor: healthFactor.decimalPlaces(5).toString(),
      totalCollateralUsd: totalCollateralUsd.decimalPlaces(2).toString(10),
    },
  });
}

export function ethersBnToBn(value: ethers.BigNumber, decimals: number): BigNumber {
  return new BigNumber(value.toString()).shiftedBy(-decimals);
}

export function arrayChunks(arr: Array<any>, chunkMaxLength: number) {
  const chunks = [];

  for (let i = 0; i < arr.length; i += chunkMaxLength) {
    chunks.push(arr.slice(i, i + chunkMaxLength));
  }

  return chunks;
}

export interface AccountData {
  totalDebtETH: ethers.BigNumber;
  totalCollateralETH: ethers.BigNumber;
  healthFactor: ethers.BigNumber;
}
