import { Finding, FindingSeverity, FindingType } from "forta-agent";

type contractType = {
  address: string;
  name: string;
};

const APESWAP_MASTER_APE: contractType = {
  address: "0x5c8D727b265DBAfaba67E050f2f739cAeEB4A6F9",
  name: "Master Ape",
};

const UPDATE_MULTIPLIER_FUNCTION: string = "function updateMultiplier(uint256 multiplierNumber)";

const createFinding = (multiplier: string, contractDetails: contractType): Finding => {
  return Finding.fromObject({
    name: "Bonus Multiplier changed",
    description: `updateMultiplier function call detected from ${contractDetails.name} contract`,
    alertId: "APESWAP-11",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      "contract Address": contractDetails.address,
      "New Bonus Multiplier": multiplier,
    },
  });
};

export { contractType, APESWAP_MASTER_APE, UPDATE_MULTIPLIER_FUNCTION, createFinding };
