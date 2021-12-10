import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";
import {
  decodeParameters,
  FindingGenerator,
  provideEventCheckerHandler,
} from "forta-agent-tools";

export const COMMIT_NEW_ADMIN_SIGNATURE = "CommitNewAdmin(uint256,address)";

const createFindingGenerator = (alertID: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined) => {
    const { 1: newAdmin } = decodeParameters(
      ["uint256", "address"],
      metadata?.data
    );
    return Finding.fromObject({
      name: "Curve Admin Event Detected",
      description: "New Admin Committed.",
      alertId: alertID,
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
      metadata: {
        newAdmin: newAdmin.toLowerCase(),
      },
    });
  };
};

const provideCommitNewAdminEvent = (
  alertID: string,
  address: string
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideEventCheckerHandler(
      createFindingGenerator(alertID),
      COMMIT_NEW_ADMIN_SIGNATURE,
      address
    );
    const findings: Finding[] = await agentHandler(txEvent);

    return findings;
  };
};

export default provideCommitNewAdminEvent;
