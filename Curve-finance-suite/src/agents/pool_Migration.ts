import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";
import {
  provideFunctionCallsDetectorAgent,
  FindingGenerator,
} from "general-agents-module";

export const MIGRATE_POOL_SIG = "migrate_to_new_pool(address,address,uint256)";

const createFindingGenerator = (alertId: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    return Finding.fromObject({
      name: "Finding Test",
      description: "Finding for test",
      alertId: alertId,
      severity: FindingSeverity.Low,
      type: FindingType.Unknown,
      metadata,
    });
  };
};

export default function provideMıgratePoolAgent(
  alertID: string,
  contractAddress: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideFunctionCallsDetectorAgent(
      createFindingGenerator(alertID),
      MIGRATE_POOL_SIG,
      { to: contractAddress }
    );
    const findings = await agentHandler(txEvent);
    return findings;
  };
}
