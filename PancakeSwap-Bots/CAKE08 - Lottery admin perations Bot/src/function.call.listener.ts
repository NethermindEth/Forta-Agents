import {
    Finding,
    HandleTransaction,
    TransactionEvent,
    FindingSeverity,
    FindingType,
  } from "forta-agent";
  
  import {
    ABI,
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
    const functionCalls = txEvent.filterFunction(
      ABI,
      PanCakeSwapLottery_Address
    );
  
    functionCalls.forEach((functionCall) => {  
        findings.push(
          Finding.fromObject({
            name: "Function Call",
            description: `Function called: ${functionCall.name}`,
            alertId: "FORTA-3",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            metadata: {

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
  