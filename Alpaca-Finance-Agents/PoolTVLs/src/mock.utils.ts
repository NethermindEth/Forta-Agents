import { utils } from "ethers";
import {
  tokenInterface,
} from "./abi";
import { when } from "jest-when";

const isCallMethod = (
  data: string,
  contractInterface: utils.Interface,
  functionName: string
): boolean => {
  const selector = data.slice(0, 10);
  return selector === contractInterface.getSighash(functionName);
};

export const isCallToBalanceOf = (token: string, account: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, tokenInterface, "balanceOf") &&
      to.toLowerCase() === token.toLowerCase() && tokenInterface.decodeFunctionData("balanceOf", data).account === account
  );

