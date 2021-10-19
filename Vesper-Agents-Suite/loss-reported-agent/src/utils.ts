import { Finding, FindingType, FindingSeverity } from "forta-agent";
import {
  FindingGenerator,
  decodeFunctionCallParameters,
} from "forta-agent-tools";

export const reportLossSignature: string = "reportLoss(address,uint256)";

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
