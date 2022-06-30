import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

import { ABI, FUNCTION_NAMES } from "./abi";

function providerHandleTransaction(contractAddress: string): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for function calls
    const functionCalls = txEvent.filterFunction(ABI, contractAddress);

    functionCalls.forEach((functionCall) => {
      let metadata = {};
      let alertId = "";

      if (functionCall.name === FUNCTION_NAMES[0]) {
        let _minPriceTicketInCake = functionCall.args._minPriceTicketInCake.toString();
        let _maxPriceTicketInCake = functionCall.args._maxPriceTicketInCake.toString();
        alertId = "CAKE-8-3";

        metadata = { _minPriceTicketInCake, _maxPriceTicketInCake };
      } else if (functionCall.name === FUNCTION_NAMES[1]) {
        let _maxNumberTicketsPerBuy = functionCall.args._maxNumberTicketsPerBuy.toString();
        alertId = "CAKE-8-4";

        metadata = { _maxNumberTicketsPerBuy };
      }

      findings.push(
        Finding.fromObject({
          name: "Function Call",
          description: `PancakeSwapLottery: ${functionCall.name}`,
          alertId,
          protocol: "PancakeSwap",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata,
        })
      );
    });

    return findings;
  };
}

export default {
  providerHandleTransaction,
};
