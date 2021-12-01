import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import createFinding from "../utils/create.finding";

// Event signature found in Factory.vy in Curve repo
export const DEPLOY_META_POOL_SIGNATURE =
  "MetaPoolDeployed(address,address,uint256,uint256,address)";

/*
const createFinding = (alertID: string): Finding => {
  return Finding.fromObject({
    name: "Deploy Meta Pool Event",
    description: "New meta pool is deployed",
    alertId: alertID,
    severity: FindingSeverity.Info,
    type: FindingType.Unknown,
  });
};
*/

export default function provideMetaPoolDeployment(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.addresses[address] == false) return findings;

    if (txEvent.filterEvent(DEPLOY_META_POOL_SIGNATURE, address).length > 0) {
      findings.push(createFinding("Deploy Meta Pool Event", "New meta pool is deployed", alertID));
    }

    return findings;
  };
}
