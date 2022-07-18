import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { ABI } from "./abi";
import { createFunctionFinding } from "./findings";

function providerHandleTransaction(contractAddress: string): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    // filter the transaction logs for function calls
    const functionCalls = txEvent.filterFunction(ABI, contractAddress);

    functionCalls.forEach((functionCall) => {
      let metadata:{[key:string]:string} = {};

      const keys:string[] = Object.keys(functionCall.args);

      keys.forEach((key) => {

        metadata[key] = functionCall.args[key];

      });


      findings.push(createFunctionFinding(functionCall.name, functionCall.name, metadata));
    });

    return findings;
  };
}

export default {
  providerHandleTransaction,
};
