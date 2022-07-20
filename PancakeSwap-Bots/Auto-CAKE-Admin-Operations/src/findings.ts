import { Finding, FindingType, FindingSeverity } from "forta-agent";
import { ALERTS } from "./abi";

export const createEventFinding = (_name: string) => {
  return Finding.fromObject({
    name: "CakeVault Event Emitted",
    description: `CakeVault contract is ${_name}d`,
    alertId: ALERTS[_name],
    protocol: "PancakeSwap",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
  });
};

export const createFunctionFinding = (_name: string, _metadata: {}) => {
  return Finding.fromObject({
    name: "CakeVault Function Called",
    description: `CakeVault Function (${_name})`,
    alertId: ALERTS[_name],
    protocol: "PancakeSwap",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: _metadata,
  });
};
