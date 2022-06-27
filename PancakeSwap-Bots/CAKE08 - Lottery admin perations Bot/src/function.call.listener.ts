import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

import { ABI, PANCAKE_SWAP_LOTTERY_ADDRESS, FUNCTION_NAMES } from "./agent.config";

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  // filter the transaction logs for function calls
  const functionCalls = txEvent.filterFunction(ABI, PANCAKE_SWAP_LOTTERY_ADDRESS);

  functionCalls.forEach((functionCall) => {
    let metadata = {};

    if (functionCall.name === FUNCTION_NAMES[0]) {
      let { _minPriceTicketInCake, _maxPriceTicketInCake } = functionCall.args;
      metadata = { _minPriceTicketInCake, _maxPriceTicketInCake };
    } else if (functionCall.name === FUNCTION_NAMES[1]) {
      let { _maxNumberTicketsPerBuy } = functionCall.args;
      metadata = { _maxNumberTicketsPerBuy };
    }

    findings.push(
      Finding.fromObject({
        name: "Function Call",
        description: `Function called: ${functionCall.name}`,
        alertId: "PCSLottery-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata,
      })
    );
  });

  return findings;
};

export default {
  handleTransaction,
};
