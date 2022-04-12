import {
  Finding,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import { utils } from "ethers";

export const createFinding = (desc: utils.TransactionDescription, from: string) => {
  // Create a list of the params of the function
  const argumentsList: any[] = desc.functionFragment.inputs.map(obj => obj.name); 
  // create metadata
  const metadata: Record<string, string> = {
    method: desc.name,
    sender: from,
  };
  for (let key of argumentsList) {
    metadata[key] = desc.args[key].toString();
  }

  return Finding.fromObject({
    name: "Ondo Finance Registry Role Change Operation",
    description: `${desc.name} call detected`,
    alertId: "ONDO-1",
    protocol: "ONDO",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Medium,
    metadata,
  });
};

export default {
  createFinding,
};
