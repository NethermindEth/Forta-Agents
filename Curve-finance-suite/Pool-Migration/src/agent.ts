import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from 'forta-agent';
import {
  FindingGenerator,
  provideFunctionCallsDetectorHandler
} from 'forta-agent-tools';
import { utils } from 'ethers';

// Pool Migrator interface
export const PM_IFACE: utils.Interface = new utils.Interface([
  'function migrate_to_new_pool(address _old_pool, address _new_pool, uint256 _amount) external returns (uint256)',
]);

const POOL_MIGRATION_ADDRESS: string = "0xd6930b7f661257DA36F93160149b031735237594";

const createFindingGenerator = (alertId: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    return Finding.fromObject({
      name: 'Pool Migration Finding',
      description: 'Pool migrated to new address',
      alertId: alertId,
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
      metadata:{
        oldPool: metadata?.arguments[0],
        newPool: metadata?.arguments[1],
        amount: metadata?.arguments[2]
      },
    });
  };
};


export function provideMigratePoolAgent(
  alertID: string,
  contractAddress: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideFunctionCallsDetectorHandler(
      createFindingGenerator(alertID),
      PM_IFACE.getFunction('migrate_to_new_pool').format('sighash'),
      { to: contractAddress }
    );
    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
}

export default {
  handleTransaction: provideMigratePoolAgent(
    "CURVE-3",
    POOL_MIGRATION_ADDRESS
  )
}