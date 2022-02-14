import { utils } from "ethers";
import { keeperRegistryInterface } from "./abi";
import { when } from "jest-when";

const isCallMethod = (
  data: string,
  contractInterface: utils.Interface,
  functionName: string
): boolean => {
  const selector = data.slice(0, 10);
  return selector === contractInterface.getSighash(functionName);
};

export const isCallToGetMinBalance = when(({ data }) =>
  isCallMethod(data, keeperRegistryInterface, "getMinBalanceForUpkeep")
);

export const isCallToGetUpkeep = when(({ data }) =>
  isCallMethod(data, keeperRegistryInterface, "getUpkeep")
);
