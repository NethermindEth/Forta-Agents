import { utils } from "ethers";
import { keeperInterface, strategyInterface } from "./abi";
import { when } from "jest-when";

const isCallMethod = (
  data: string,
  contractInterface: utils.Interface,
  functionName: string
): boolean => {
  const selector = data.slice(0, 10);
  return selector === contractInterface.getSighash(functionName);
};

export const isCallToStrategyArray = (index: number) =>
  when(
    ({ data }) =>
      isCallMethod(data, keeperInterface, "strategyArray") &&
      keeperInterface.decodeFunctionData("strategyArray", data)[0].eq(index)
  );

export const isCallToLiquidityOfThis = (strategyAddress: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, strategyInterface, "liquidityOfThis") &&
      strategyAddress === to
  );

export const isCallToLiquidityOf = (strategyAddress: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, strategyInterface, "liquidityOf") &&
      strategyAddress === to
  );
