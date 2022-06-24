import {
    BlockEvent,
    Finding,
    HandleBlock,
    HandleTransaction,
    TransactionEvent,
    FindingSeverity,
    FindingType,
  } from "forta-agent";
  
  import {
    events,
    PanCakeSwapLottery_Address
  } from "./agent.config"
  
  let findingsCount = 0;
  
  const handleTransaction: HandleTransaction = async (
    txEvent: TransactionEvent
  ) => {
    const findings: Finding[] = [];
  
    // limiting this agent to emit only 5 findings so that the alert feed is not spammed
    if (findingsCount >= 5) return findings;
  
    // filter the transaction logs for NewRandomGenerator events
    const newRandomGeneratorEvents = txEvent.filterLog(
      events.NewRandomGenerator,
      PanCakeSwapLottery_Address
    );
  
    newRandomGeneratorEvents.forEach((newRandomGeneratorEvent) => {
      // extract NewRandomGenerator event arguments
      const { to, from, randomGenerator } = newRandomGeneratorEvent.args
  
        findings.push(
          Finding.fromObject({
            name: "New Random Generator",
            description: `Random Number Generator changed`,
            alertId: "FORTA-1",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            metadata: {
              to,
              from,
              randomGenerator
            },
          })
        );
        findingsCount++;
    });
  
    return findings;
  };
  

  
  export default {
    handleTransaction,
    
  };
  