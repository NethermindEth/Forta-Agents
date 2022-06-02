import { Interface } from "@ethersproject/abi";

import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";

export interface AgentConfig {}

const createFinding = (): Finding => {
  return Finding.fromObject({
    name: "Detect bad debt immediately after market interaction",
    description: "",
    alertId: "UMEE-11",
    protocol: "Umee",
    type: FindingType.Info,
    severity: FindingSeverity.Low,
  });
};

export default {
  createFinding,
};
