import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

import { ABI, PANCAKE_SWAP_LOTTERY_ADDRESS, FUNCTION_NAMES } from "./bot.config";

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  // filter the transaction logs for function calls
  const functionCalls = txEvent.filterFunction(ABI, PANCAKE_SWAP_LOTTERY_ADDRESS);

  functionCalls.forEach((functionCall) => {
    let metadata = {};

    if (functionCall.name === FUNCTION_NAMES[0]) {
      let _minPriceTicketInCake = functionCall.args._minPriceTicketInCake.toString();
      let _maxPriceTicketInCake = functionCall.args._maxPriceTicketInCake.toString();

      metadata = { _minPriceTicketInCake, _maxPriceTicketInCake };
    } else if (functionCall.name === FUNCTION_NAMES[1]) {
      let _maxNumberTicketsPerBuy = functionCall.args._maxNumberTicketsPerBuy.toString();

      metadata = { _maxNumberTicketsPerBuy };
    }

    findings.push(
      Finding.fromObject({
        name: "Function Call",
        description: `PancakeSwapLottery: ${functionCall.name}`,
        alertId: "CAKE-8-3",
        protocol: "PancakeSwap",
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
