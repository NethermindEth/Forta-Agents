import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from 'forta-agent';

import {
  provideFunctionCallsDetectorAgent,
  FindingGenerator,
} from 'nethermindeth-general-agents-module';

// Function signature found in PoolMigrator.vy in Curve repo
export const MIGRATE_POOL_SIG = 'migrate_to_new_pool(address,address,uint256)';

// TODO: create and import a `createFindingGenerator` function?
const createFindingGenerator = (alertId: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    return Finding.fromObject({
      name: 'Pool Migration Finding',
      description: 'Pool migrated to new address',
      alertId: alertId,
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
      metadata,
    });
  };
};

export default function provideMıgratePoolAgent(
  alertID: string,
  contractAddress: string
): HandleTransaction {
  // TODO: import following anonymous function?
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideFunctionCallsDetectorAgent(
      createFindingGenerator(alertID),
      MIGRATE_POOL_SIG,
      { to: contractAddress }
    );
    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
}
