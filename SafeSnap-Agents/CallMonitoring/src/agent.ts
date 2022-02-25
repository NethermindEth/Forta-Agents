import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType,
} from 'forta-agent';
import { 
  ADD_PROPOSOAL,
  ADD_PROPOSAL_WITH_NONCE,
  MARK_PROPOSAL_AS_INVALID,
  MARK_PROPOSAL_AS_INVALID_BY_HASH,
  MARK_PROPOSAL_WITH_EXPIRED_ANSWER_AS_INVALID,
  EXECUTE_PROPOSAL,
  EXECUTE_PROPOSAL_WITH_INDEX,
} from "./constants";

const MODULE_ADDRESS: string = "0x0eBaC21F7f6A6599B5fa5f57Baaa974ADFEC4613";

export const provideHandleTransaction = (contractAddress: string): HandleTransaction => { 
  return async (txEvent: TransactionEvent) => {
    let findings: Finding[] = [];
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
      contractAddress,
    );

    mainFunctionInvocations.forEach((functionInvocation) => {
      // Get name of the function that is executed
      let functionName:string = functionInvocation.name;
      // Create a list of the params of the function
      let argumentsList:any[] = functionInvocation.functionFragment.inputs.map((obj)=>obj.name);

      let metadata:any = {
        by: txEvent.from,
      };
      for (let key of argumentsList) {
          metadata[key] = functionInvocation.args[key].toString();
      }

      // Create Finding
      findings.push(
        Finding.fromObject({
          name: "Zodiac/Gnosis SafeSnap",
          description: `${functionName} execeuted`,
          alertId: "SafeSnap-1",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "Gnosis SafeSnap",
          metadata: metadata,
        })
      );
    });

    return findings;
}};

export default {
  handleTransaction: provideHandleTransaction(
    MODULE_ADDRESS,
  ),
};
