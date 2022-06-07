import { Finding, FindingType, FindingSeverity, Log, getJsonRpcUrl } from "forta-agent";
import {
  FindingGenerator,
  decodeParameters,
  decodeParameter,
} from "forta-agent-tools";

export const createFindingCallDetector: FindingGenerator = (callInfo) => {
  return Finding.fromObject({
    name: "Loss Reported",
    description:
      "A loss was reported by strategy.",
    alertId: "Vesper",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Vesper",
    metadata: {
      strategyAddress: callInfo?.arguments[0],
      lossValue: callInfo?.arguments[1],
    },
  });
};

export const createFindingEventDetector: FindingGenerator = (eventInfo) => {
  const { 1: lossValue } = decodeParameters(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
    eventInfo?.data
  );
  const strategyAddress: string = decodeParameter("address", eventInfo?.topics[1]);
  return Finding.fromObject({
    name: "Loss Reported",
    description: "A loss was reported by strategy.",
    alertId: "Vesper",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Vesper",
    metadata: {
      strategyAddress,
      lossValue,
    },
  });
};

export const hasLosses = (log: Log) => {
  const data = log.data;
  const { 1: loss } = decodeParameters(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
    data
  );
  return BigInt(loss) > BigInt(0);
};
