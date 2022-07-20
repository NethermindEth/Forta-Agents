import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { FUNC_ABI } from "./abi";
import { createFunctionFinding } from "./findings";

export function provideHandleTransaction(contractAddress: string): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    // filter the transaction logs for function calls
    const functionCalls = txEvent.filterFunction(FUNC_ABI, contractAddress);

    functionCalls.forEach((functionCall) => {
      let metadata: { [key: string]: string } = {};

      //get all args keys
      const allKeys: string[] = Object.keys(functionCall.args);

      //slice index keys and keep string keys
      const keys: string[] = allKeys.slice(allKeys.length / 2);

      //populate metadata with args
      keys.forEach((key) => {
        metadata[key.slice(1)] = functionCall.args[key].toString(); //slice to remove leading "_" from property name
      });

      findings.push(createFunctionFinding(functionCall.name, metadata));
    });

    return findings;
  };
}
