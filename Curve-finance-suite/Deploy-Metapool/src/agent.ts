import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
// import createFinding from "../utils/create.finding";

// Event signature found in Factory.vy in Curve repo
export const DEPLOY_META_POOL_SIGNATURE =
  "MetaPoolDeployed(address,address,uint256,uint256,address)";

const CURVE_FACTORY_ADDRESS: string = "0x0959158b6040D32d04c301A72CBFD6b39E21c9AE";

// NOTE FROM PR COMMENTS: Add metadata
// to make Finding more useful
const createFinding = (alertID: string): Finding => {
  return Finding.fromObject({
    name: "Deploy Meta Pool Event",
    description: "New meta pool is deployed",
    alertId: alertID,
    severity: FindingSeverity.Info,
    type: FindingType.Unknown,
  });
};

export function provideMetaPoolDeployment(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (!txEvent.addresses[address]) return findings;

    if (txEvent.filterEvent(DEPLOY_META_POOL_SIGNATURE, address).length > 0) {
      findings.push(createFinding(alertID));
    }

    return findings;
  };
}

export default {
  handleTransaction: provideMetaPoolDeployment(
    "CURVE-9",
    CURVE_FACTORY_ADDRESS,
  )
};