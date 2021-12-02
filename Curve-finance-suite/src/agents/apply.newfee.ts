import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";

import { provideEventCheckerHandler } from "forta-agent-tools";

import createFindingGenerator from "../utils/create.finding.generator";

export const NEW_FEE_EVENT_SIG = "NewFee(uint256,uint256)";

export default function provideApplyNewFeesAgent(
  alertID: string,
  curveDaoAddress: string
): HandleTransaction {
  return async(txEvent: TransactionEvent): Promise<Finding[]> => {

    let findings: Finding[] = [];

    // Filter only for TXs that involve the Curve DAO address
    if (txEvent.addresses[curveDaoAddress] == false) {
      return findings;
    }

    // Set up a handler to search for `NewFee` events
    const handler = provideEventCheckerHandler(
      createFindingGenerator(
        "NewFee set",
        "DAO has assigned a new fee to a pool",
        alertID,
        FindingSeverity.Info,
        FindingType.Info
      ),
      NEW_FEE_EVENT_SIG
    );

    // Execute the handler to create findings for each NewFee event
    findings = await handler(txEvent);
    return findings;
  };
}
