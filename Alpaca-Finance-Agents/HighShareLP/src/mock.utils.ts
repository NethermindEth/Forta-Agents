import { utils, BigNumberish } from "ethers";
import {
  workerInterface,
  tokenInterface,
  positionManagerInterface,
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

export const isCallToTotalSupply = (token: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, tokenInterface, "totalSupply") &&
      to.toLowerCase() === token.toLowerCase()
  );

export const isCallToLpToken = (token: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, workerInterface, "lpToken") &&
      to.toLowerCase() === token.toLowerCase()
  );

export const isCallToPid = (token: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, workerInterface, "pid") &&
      to.toLowerCase() === token.toLowerCase()
  );

export const isCallToMasterChef = (token: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, workerInterface, "masterChef") &&
      to.toLowerCase() === token.toLowerCase()
  );

export const isCallToBscPool = (token: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, workerInterface, "bscPool") &&
      to.toLowerCase() === token.toLowerCase()
  );

export const isCallToWexMaster = (token: string) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, workerInterface, "wexMaster") &&
      to.toLowerCase() === token.toLowerCase()
  );

export const isCallToUserInfo = (
  master: string,
  pid: BigNumberish,
  worker: string
) =>
  when(
    ({ data, to }) =>
      isCallMethod(data, positionManagerInterface, "userInfo") &&
      to.toLowerCase() === master.toLowerCase() &&
      positionManagerInterface
        .decodeFunctionData("userInfo", data)
        .id.eq(pid) &&
      positionManagerInterface.decodeFunctionData("userInfo", data).account ===
        worker
  );
