import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from 'forta-agent';

import { provideFunctionCallsDetectorAgent } from 'nethermindeth-general-agents-module';

import createFindingGenerator from "../utils/create.finding.generator";

// Function signature found in PoolMigrator.vy in Curve repo
export const MIGRATE_POOL_SIG = 'migrate_to_new_pool(address,address,uint256)';

export default function provideMıgratePoolAgent(
  alertID: string,
  contractAddress: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideFunctionCallsDetectorAgent(
      createFindingGenerator(
        "Pool Migration Finding",
        "Pool migrated to new address",
        alertID,
        FindingSeverity.Medium,
        FindingType.Unknown
      ),
      MIGRATE_POOL_SIG,
      { to: contractAddress }
    );
    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
}
