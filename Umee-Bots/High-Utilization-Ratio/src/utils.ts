import BigNumber from "bignumber.js";
import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";
import { BALANCE_OF_ABI, TOTAL_SUPPLY_ABI } from "./constants";
import { MulticallContract } from "./multicall";

export interface AgentConfig {
  absoluteThreshold?: string;
  percentageThreshold?: string;
  alertCooldown: {
    absolute: number;
    percentage: number;
  };
  lendingPoolAddress: string;
  lendingPoolConfiguratorAddress: string;
}

export interface ReserveData {
  asset: MulticallContract;
  uTokenAddress: string;
  stableDebtToken: MulticallContract;
  variableDebtToken: MulticallContract;
  usageRatio: BigNumber;
  lastAlertTimestamp: {
    absolute: number;
    percentage: number;
  };
}

export type ReserveBalances = [ethers.BigNumber, ethers.BigNumber, ethers.BigNumber];

export function createAbsoluteThresholdFinding(asset: string, usageRatio: BigNumber): Finding {
  return Finding.from({
    alertId: "UMEE-7-1",
    name: "High asset utilization ratio",
    description: "An asset pool is currently with a high utilization ratio",
    type: FindingType.Info,
    severity: FindingSeverity.Low,
    protocol: "Umee",
    metadata: {
      asset: asset.toLowerCase(),
      usageRatio: usageRatio.toString(10),
    },
  });
}

export function createPercentageThresholdFinding(
  asset: string,
  usageRatio: BigNumber,
  percentageIncrease: BigNumber
): Finding {
  return Finding.from({
    alertId: "UMEE-7-2",
    name: "High asset utilization ratio increase",
    description: "An asset pool's utilization ratio increased significantly",
    type: FindingType.Info,
    severity: FindingSeverity.Low,
    protocol: "Umee",
    metadata: {
      asset: asset.toLowerCase(),
      usageRatio: usageRatio.toString(10),
      percentageIncrease: percentageIncrease.toString(10),
    },
  });
}

export function arrayChunks<T>(arr: Array<T>, chunkMaxLength: number): Array<T[]> {
  const chunks = [];

  for (let i = 0; i < arr.length; i += chunkMaxLength) {
    chunks.push(arr.slice(i, i + chunkMaxLength));
  }

  return chunks;
}

export function createReserveData(
  asset: string,
  uTokenAddress: string,
  stableDebtTokenAddress: string,
  variableDebtTokenAddress: string
): ReserveData {
  return {
    asset: new MulticallContract(asset, [BALANCE_OF_ABI]),
    uTokenAddress: uTokenAddress,
    stableDebtToken: new MulticallContract(stableDebtTokenAddress, [TOTAL_SUPPLY_ABI]),
    variableDebtToken: new MulticallContract(variableDebtTokenAddress, [TOTAL_SUPPLY_ABI]),
    usageRatio: new BigNumber(-1),
    lastAlertTimestamp: {
      absolute: 0,
      percentage: 0,
    },
  };
}

export function usageRatio(
  underlyingAssetBalance: ethers.BigNumber,
  stableDebtTokenSupply: ethers.BigNumber,
  variableDebtTokenSupply: ethers.BigNumber
): BigNumber {
  const totalDebt = new BigNumber(stableDebtTokenSupply.add(variableDebtTokenSupply).toString());
  const availableLiquidity = new BigNumber(underlyingAssetBalance.toString());

  return totalDebt.eq(0) ? new BigNumber(0) : totalDebt.dividedBy(availableLiquidity.plus(totalDebt));
}
