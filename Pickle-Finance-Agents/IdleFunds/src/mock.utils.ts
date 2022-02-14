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

export const isCallToAvailable = (pickleJar: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, pickleJarInterface, "available") && pickleJar === to
  );

export const isCallToBalance = (pickleJar: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, pickleJarInterface, "balance") && pickleJar === to
  );

export const isCallToTotalLiquidity = (pickleJar: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, pickleJarInterface, "totalLiquidity") &&
      pickleJar === to
  );

export const isCallToLiquidityOfThis = (pickleJar: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, pickleJarInterface, "liquidityOfThis") &&
      pickleJar === to
  );

export const isCallToName = (pickleJar: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, pickleJarInterface, "name") && pickleJar === to
  );

export const isCallToDevelopmentVaults = when(({ data }) =>
  isCallMethod(data, pickleRegistryInterface, "developmentVaults")
);

export const isCallToProductionVaults = when(({ data }) =>
  isCallMethod(data, pickleRegistryInterface, "productionVaults")
);
