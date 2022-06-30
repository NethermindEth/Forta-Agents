import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

import { EVENTS } from "./bot.config";

function providerHandleTransaction(contractAddress: string): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for NewOperatorAndTreasuryAndInjectorAddresses events
    const newOperatorAndTreasuryAndInjectorAddressesEvents = txEvent.filterLog(
      EVENTS.NewOperatorAndTreasuryAndInjectorAddresses,
      contractAddress
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
}
export default {
  providerHandleTransaction,
};
