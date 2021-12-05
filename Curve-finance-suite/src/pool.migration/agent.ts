import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from 'forta-agent';

// NOTE: In the Forta docs, it states the entry point
// for your agent will always be a file named 'agent.ts'
// and export a function named 'handleTransaction'.
// Rename file and agent function?

// NOTE: Tried using using updated GAM, but could not
// get it to continue without erroring out. May need
// documentation for `nethermindeth-general-agents-module'
// to compare to new `forta-agent-tools`.
// import { provideFunctionCallsDetectorHandler } from "forta-agent-tools";
import { provideFunctionCallsDetectorAgent } from 'nethermindeth-general-agents-module';

import createFindingGenerator from "../utils/create.finding.generator";

// Function signature found in PoolMigrator.vy in Curve repo
export const MIGRATE_POOL_SIG = 'migrate_to_new_pool(address,address,uint256)';

// NOTE: "ı" in migrate not a standard "i". Why?
// NOTE 02: `provideFunctionCallsDetectorHandler` is
// what has been giving me problems (check note on L9)
function provideMıgratePoolAgent(
  alertID: string,
  contractAddress: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    // NOTE: Attempted to create `agentHandler` outside of
    // `provideMıgratePoolAgent` but couldn't figure out how
    // to pass arguments `alertID` and `contractAddress` to
    // be used by `createFindingGenerator`.
    // Current implementation follows docs.
    const agentHandler = provideFunctionCallsDetectorAgent(
      createFindingGenerator(
        "Pool Migration Finding",
        "Pool migrated to new address",
        alertID,
        FindingSeverity.Medium,
        FindingType.Unknown,
        [{
          type: "address",
          name: "from"
        },
        {
          type: "string",
          name: "input"
        },
        {
          type: "address",
          name: "to"
        }]
      ),
      MIGRATE_POOL_SIG,
      { to: contractAddress }
    );
    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
}

export default provideMıgratePoolAgent;