import { utils } from "ethers";
import { workerConfigInterface } from "./abi";
import { when } from "jest-when";

const isCallMethod = (
  data: string,
  contractInterface: utils.Interface,
  functionName: string
): boolean => {
  const selector = data.slice(0, 10);
  return selector === contractInterface.getSighash(functionName);
};

export const isCallToIsStable = (worker: string) =>
  when(
    ({ data }) =>
      isCallMethod(data, workerConfigInterface, "isStable") &&
      workerConfigInterface.decodeFunctionData("isStable", data).worker ===
        worker
  );
