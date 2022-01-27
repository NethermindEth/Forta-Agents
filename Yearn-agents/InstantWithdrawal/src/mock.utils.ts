import { utils } from "ethers";
import { vaultInterface } from "./abi";
import { when } from "jest-when";

const isCallMethod = (
  data: string,
  contractInterface: utils.Interface,
  functionName: string
): boolean => {
  const selector = data.slice(0, 10);
  return selector === contractInterface.getSighash(functionName);
};

export const isCallToTotalSupply = when(({ data }) =>
  isCallMethod(data, vaultInterface, "totalSupply")
);

export const isCallToBalanceOfForAccount = when(
  ({ data }, account) =>
    isCallMethod(data, vaultInterface, "balanceOf") &&
    vaultInterface.decodeFunctionData("balanceOf", data).account === account
);

export const isCallToBalanceOf = when(({ data }) =>
  isCallMethod(data, vaultInterface, "balanceOf")
);

