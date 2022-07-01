import { Finding, FindingType, FindingSeverity } from "forta-agent";
import { ALERTS } from "./abi";

export const createEventFinding = (_name: string, _description: string, _metadata: {}) => {
  return Finding.fromObject({
    name: "PancakeSwapLottery Event Emitted",
    description: `PancakeSwapLottery Event ${_name}(${_description})`,
    alertId: ALERTS[_name],
    protocol: "PancakeSwap",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: _metadata,
  });
};

export const createFunctionFinding = (_name: string, _description: string, _metadata: {}) => {
  return Finding.fromObject({
    name: "PancakeSwapLottery Function Called",
    description: `PancakeSwapLottery Function (${_description})`,
    alertId: ALERTS[_name],
    protocol: "PancakeSwap",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: _metadata,
  });
};
