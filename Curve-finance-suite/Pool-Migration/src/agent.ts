import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from 'forta-agent';
import {
  FindingGenerator,
  // provideFunctionCallsDetectorHandler,
} from 'forta-agent-tools';

// NOTE: Tried using using updated GAM, but could not
// get it to continue without erroring out. May need
// documentation for `nethermindeth-general-agents-module'
// to compare to new `forta-agent-tools`.
import { provideFunctionCallsDetectorAgent } from 'nethermindeth-general-agents-module';

const POOL_MIGRATION_ADDRESS: string = "0xd6930b7f661257DA36F93160149b031735237594";

// Function signature found in PoolMigrator.vy in Curve repo
export const MIGRATE_POOL_SIG = 'migrate_to_new_pool(address,address,uint256)';

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

// NOTE: "ı" in migrate not a standard "i". Why?
// NOTE 02: `provideFunctionCallsDetectorHandler` is
// what has been giving me problems (check note on L13)
export function provideMıgratePoolAgent(
  alertID: string,
  contractAddress: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    // NOTE: Attempted to create `agentHandler` outside of
    // `provideMıgratePoolAgent` but couldn't figure out how
    // to pass arguments `alertID` and `contractAddress` to
    // be used by `createFindingGenerator`.
    const agentHandler = provideFunctionCallsDetectorAgent(
      createFindingGenerator(alertID),
      MIGRATE_POOL_SIG,
      { to: contractAddress }
    );
    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
}

export default {
  handleTransaction: provideMıgratePoolAgent(
    "CURVE-3",
    POOL_MIGRATION_ADDRESS
  )
}