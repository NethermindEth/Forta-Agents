import { Finding, FindingType, FindingSeverity } from "forta-agent";
import {
  FindingGenerator,
  decodeFunctionCallParameters,
} from "forta-agent-tools";
import { AbiItem } from "web3-utils";

export const reportLossABI = {
  name: "reportLoss",
  type: "function",
  inputs: [
    {
      type: "address",
      name: "",
    },
    {
      type: "uint256",
      name: "",
    },
  ],
} as AbiItem;

export const createFinding: FindingGenerator = (callInfo) => {
  const { 0: strategyAddress, 1: lossValue } = decodeFunctionCallParameters(
    ["address", "uint256"],
    callInfo.input
  );

  return Finding.fromObject({
    name: "",
    description: "",
    alertId: "",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      strategyAddress: strategyAddress,
      lossValue: lossValue,
    },
  });
};

export const getPoolAccountants = async (): Promise<string[]> => {
  return [];
};
