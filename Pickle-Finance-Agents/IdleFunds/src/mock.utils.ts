import { utils } from "ethers";
import { pickleJarInterface, pickleRegistryInterface } from "./abi";
import { when } from "jest-when";

const isCallMethod = (
  data: string,
  contractInterface: utils.Interface,
  functionName: string
): boolean => {
  const selector = data.slice(0, 10);
  return selector === contractInterface.getSighash(functionName);
};

export const isCallToAvailable = when(({ data }) =>
  isCallMethod(data, pickleJarInterface, "available")
);

export const isCallToBalance = when(({ data }) =>
  isCallMethod(data, pickleJarInterface, "balance")
);

export const isCallToDevelopmentVaults = when(({ data }) =>
  isCallMethod(data, pickleRegistryInterface, "developmentVaults")
);

export const isCallToProductionVaults = when(({ data }) =>
  isCallMethod(data, pickleRegistryInterface, "productionVaults")
);
