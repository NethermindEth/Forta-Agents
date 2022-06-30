import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { ABI } from "./abi";
import { createFunctionFinding } from "./findings";

function providerHandleTransaction(contractAddress: string): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for function calls
    const functionCalls = txEvent.filterFunction(ABI, contractAddress);

    functionCalls.forEach((functionCall) => {
      let metadata = {};

      if (functionCall.name === "setMinAndMaxTicketPriceInCake") {
        let _minPriceTicketInCake = functionCall.args._minPriceTicketInCake.toString();
        let _maxPriceTicketInCake = functionCall.args._maxPriceTicketInCake.toString();

        metadata = { _minPriceTicketInCake, _maxPriceTicketInCake };
      } else {
        let _maxNumberTicketsPerBuy = functionCall.args._maxNumberTicketsPerBuy.toString();

        metadata = { _maxNumberTicketsPerBuy };
      }

      findings.push(
        createFunctionFinding(
          functionCall.name,
          functionCall.name,
          metadata
          )
        );
    });

    return findings;
  };
}

export default {
  providerHandleTransaction,
};
