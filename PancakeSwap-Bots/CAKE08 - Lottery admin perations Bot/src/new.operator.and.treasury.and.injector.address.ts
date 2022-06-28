import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

import { EVENTS, PANCAKE_SWAP_LOTTERY_ADDRESS } from "./agent.config";

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  // filter the transaction logs for NewOperatorAndTreasuryAndInjectorAddresses events
  const newOperatorAndTreasuryAndInjectorAddressesEvents = txEvent.filterLog(
    EVENTS.NewOperatorAndTreasuryAndInjectorAddresses,
    PANCAKE_SWAP_LOTTERY_ADDRESS
  );

  newOperatorAndTreasuryAndInjectorAddressesEvents.forEach((newOperatorAndTreasuryAndInjectorAddressesEvent) => {
    // extract New Operator And Treasury And Injector Addresses event arguments
    const { operator, treasury, injector } = newOperatorAndTreasuryAndInjectorAddressesEvent.args;

    findings.push(
      Finding.fromObject({
        name: "New Operator And Treasury And Injector Addresses",
        description: "PancakeSwapLottery: New Operator And Treasury And Injector Addresses",
        alertId: "CAKE-8-2",
        protocol: "PancakeSwap",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          operator,
          treasury,
          injector,
        },
      })
    );
  });

  return findings;
};

export default {
  handleTransaction,
};
