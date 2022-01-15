import { utils } from "ethers";
import { pickleRegistryInterface } from "./abi";
import { when } from "jest-when";

const isCallMethod = (
  data: string,
  contractInterface: utils.Interface,
  functionName: string
): boolean => {
  const selector = data.slice(0, 10);
  return selector === contractInterface.getSighash(functionName);
};

export const isCallToDevelopmentVaults = when(({ data }) =>
  isCallMethod(data, pickleRegistryInterface, "developmentVaults")
);

export const isCallToProductionVaults = when(({ data }) =>
  isCallMethod(data, pickleRegistryInterface, "productionVaults")
);
