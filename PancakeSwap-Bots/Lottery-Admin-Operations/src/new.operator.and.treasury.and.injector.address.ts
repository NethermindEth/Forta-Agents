import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

import { EVENTS } from "./abi";
import { createEventFinding } from "./findings";

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
      let metadata = {
        operator,
        treasury,
        injector,
      };

      findings.push(
        createEventFinding(
          newOperatorAndTreasuryAndInjectorAddressesEvent.name,
          "Operator, Treasury and Injector Addresses changed",
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
