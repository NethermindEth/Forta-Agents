// NOTE: When testing with a legitimate
// tx hash, it finds 0 findings.
import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from 'forta-agent';
import {
  FindingGenerator,
  provideFunctionCallsDetectorHandler,
  decodeParameters,
} from 'forta-agent-tools';
import { utils } from 'ethers';

// NOTE: String written in Solidity style, despite contract
// written in Vyper
// Pool Migrator interface
export const PM_IFACE: utils.Interface = new utils.Interface([
  'function migrate_to_new_pool(address _old_pool, address _new_pool, uint256 _amount) external returns (uint256)',
]);

// migrate_to_new_pool(_old_pool: address, _new_pool: address, _amount: uint256) -> uint256
const POOL_MIGRATION_ADDRESS: string = "0xd6930b7f661257DA36F93160149b031735237594";

// Function signature found in PoolMigrator.vy in Curve repo
//export const MIGRATE_POOL_SIG = 'migrate_to_new_pool(address,address,uint256)';

const createFindingGenerator = (alertId: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    const {0:address} = decodeParameters(
      ["address", "address", "uint256"],
      metadata?.data
    );

    return Finding.fromObject({
      name: 'Pool Migration Finding',
      description: 'Pool migrated to new address',
      alertId: alertId,
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
      metadata:{
        from: metadata!.from,
        to: metadata!.to,
      },
    });
  };
};


export function provideMigratePoolAgent(
  alertID: string,
  contractAddress: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {

    // console.log("txEvent.transaction.data is: " + JSON.stringify(txEvent.transaction.data));
    
    // NOTE: Attempted to create `agentHandler` outside of
    // `provideMıgratePoolAgent` but couldn't figure out how
    // to pass arguments `alertID` and `contractAddress` to
    // be used by `createFindingGenerator`.
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