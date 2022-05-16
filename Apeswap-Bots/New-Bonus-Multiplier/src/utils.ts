import { Finding, FindingSeverity, FindingType } from "forta-agent";

const UPDATE_MULTIPLIER_FUNCTION: string = "function updateMultiplier(uint256 multiplierNumber)";

const createFinding = (multiplier: string, contractAddress: string): Finding => {
  return Finding.fromObject({
    name: "Bonus Multiplier changed",
    description: "updateMultiplier function call detected from Apeswap's MasterApe contract",
    alertId: "APESWAP-11",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      MasterApe: contractAddress,
      "New Bonus Multiplier": multiplier,
    },
  });
};

export { UPDATE_MULTIPLIER_FUNCTION, createFinding };
