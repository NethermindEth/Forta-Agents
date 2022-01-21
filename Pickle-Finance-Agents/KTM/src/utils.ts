import { keeperRegistryInterface } from "./abi";
import { BigNumberish, Contract, providers, BigNumber } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const getMinimumBalance = async (
  keeperRegistryAddress: string,
  keeperIndex: BigNumberish,
  blockNumber: number,
  provider: providers.Provider
): Promise<BigNumber> => {
  const keeperRegistryContract = new Contract(
    keeperRegistryAddress,
    keeperRegistryInterface,
    provider
  );
  return keeperRegistryContract.getMinBalanceForUpkeep(keeperIndex, {
    blockTag: blockNumber,
  });
};

export const getExecuteGasAndBalance = async (
  keeperRegistryAddress: string,
  keeperIndex: BigNumberish,
  blockNumber: number,
  provider: providers.Provider
): Promise<BigNumber[]> => {
  const keeperRegistryContract = new Contract(
    keeperRegistryAddress,
    keeperRegistryInterface,
    provider
  );
  const keeperInfo = await keeperRegistryContract.getUpkeep(keeperIndex, {
    blockTag: blockNumber,
  });
  return [
    BigNumber.from(keeperInfo["executeGas"]),
    BigNumber.from(keeperInfo["balance"]),
  ];
};

export const createHighFinding = (
  remainingCalls: string,
  balance: string
): Finding => {
  return Finding.fromObject({
    name: "Keeper with lower balance",
    description: "The keeper is close to reachs its minimum balance",
    alertId: "PICKLE-7-1",
    protocol: "Pickle Finance",
    severity: FindingSeverity.High,
    type: FindingType.Info,
    metadata: {
      remainingCalls: remainingCalls,
      balance: balance,
    },
  });
};

export const createInfoFinding = (
  remainingCalls: string,
  balance: string
): Finding => {
  return Finding.fromObject({
    name: "Keeper with lower balance",
    description: "The keeper is close to reachs its minimum balance",
    alertId: "PICKLE-7-2",
    protocol: "Pickle Finance",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      remainingCalls: remainingCalls,
      balance: balance,
    },
  });
};
