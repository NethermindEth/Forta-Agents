import {
    Finding,
    HandleTransaction,
    TransactionEvent,
    FindingSeverity,
    FindingType,
  } from "forta-agent";
  
  import {
    events,
    PanCakeSwapLottery_Address
  } from "./agent.config"
  
  
  const handleTransaction: HandleTransaction = async (
    txEvent: TransactionEvent
  ) => {
    const findings: Finding[] = [];
  
    // filter the transaction logs for NewOperatorAndTreasuryAndInjectorAddresses events
    const newOperatorAndTreasuryAndInjectorAddressesEvents = txEvent.filterLog(
      events.NewOperatorAndTreasuryAndInjectorAddresses,
      PanCakeSwapLottery_Address
    );
  
    newOperatorAndTreasuryAndInjectorAddressesEvents.forEach((newOperatorAndTreasuryAndInjectorAddressesEvent) => {
      // extract New Operator And Treasury And Injector Addresses event arguments
      const { from, operator, treasury, injector } = newOperatorAndTreasuryAndInjectorAddressesEvent.args;
  
        findings.push(
          Finding.fromObject({
            name: "New Operator And Treasury And Injector Addresses",
            description: `New Operator And Treasury And Injector Addresses`,
            alertId: "FORTA-2",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            metadata: {
              from,  
              operator,
              treasury,
              injector
            },
          })
        );
  
    });
  
    return findings;
  };
  

  
  export default {
    handleTransaction,
    
  };
  