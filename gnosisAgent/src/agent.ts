import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType,
  keccak256
} from 'forta-agent'

import { utils } from "ethers"
import { 
  ADD_PROPOSOAL,
  ADD_PROPOSAL_WITH_NONCE,
  MARK_PROPOSAL_AS_INVALID,
  MARK_PROPOSAL_AS_INVALID_BY_HASH,
  MARK_PROPOSAL_WITH_EXPIRED_ANSWER_AS_INVALID,
  EXECUTE_PROPOSAL,
  EXECUTE_PROPOSAL_WITH_INDEX,
  GNOSIS_ADDRESS, 
} from "./constants"

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  let findings: Finding[] = []
  const mainFunctionInvocations = txEvent.filterFunction(
    [
      EXECUTE_PROPOSAL_WITH_INDEX,
      ADD_PROPOSOAL,
      ADD_PROPOSAL_WITH_NONCE,
      MARK_PROPOSAL_AS_INVALID,
      MARK_PROPOSAL_AS_INVALID_BY_HASH,
      MARK_PROPOSAL_WITH_EXPIRED_ANSWER_AS_INVALID,
      EXECUTE_PROPOSAL
      
    ],
    GNOSIS_ADDRESS
  );

  mainFunctionInvocations.forEach((functionInvocation) => {
    // Get name of the function that is executed
    let functionName:string = functionInvocation.name
    // Create a list of the params of the function
    let argumentsList:any[] = functionInvocation.functionFragment.inputs.map((obj)=>obj.name)

    let metadata:any = {
      by: txEvent.from,
    }
    for (let key of argumentsList) {
        metadata[key] = functionInvocation.args[key].toString();
    }

    // Create Finding
    findings.push(
      Finding.fromObject({
        name: "Zodiac/Gnosis SafeSnap",
        description: `${functionName} execeuted`,
        alertId: "FORTA-8",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: metadata,
      })
    );
  });

  return findings

}

export default {
  handleTransaction,
}