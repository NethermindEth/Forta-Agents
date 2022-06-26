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
  
  const handleTransaction: HandleTransaction = async (
    txEvent: TransactionEvent
  ) => {
    const findings: Finding[] = [];
  
    // filter the transaction logs for function calls
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
    });
  
    return findings;
  };
  

  
  export default {
    handleTransaction
  };
  