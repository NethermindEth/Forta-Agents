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
  
    // filter the transaction logs for Tether transfer events
    const newRandomGeneratorEvents = txEvent.filterLog(
      events.NewRandomGenerator,
      PanCakeSwapLottery_Address
    );
  
    newRandomGeneratorEvents.forEach((newRandomGeneratorEvent) => {
      // extract transfer event arguments
      const { to, from } = newRandomGeneratorEvent.args;
  
        findings.push(
          Finding.fromObject({
            name: "New Random Generator",
            description: `High amount of USDT transferred: ${1}`,
            alertId: "FORTA-1",
            severity: FindingSeverity.Low,
            type: FindingType.Info,
            metadata: {
              to,
              from,
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
  