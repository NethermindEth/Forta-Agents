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

  console.log(txEvent.logs)

  // limiting this agent to emit only 5 findings so that the alert feed is not spammed
  if (findingsCount >= 5) return findings;

  // filter the transaction logs for Tether transfer events
  const newRandomGeneratorEvents = txEvent.filterLog(
    "event TicketsPurchase(address,uint256,uint256)", //TicketsPurchase event for testing only, should be NewRandomGenerator event
    PanCakeSwapLottery_Address
  );

  //tx for testing TicketsPurchase: 0x388af12be44d7b6933be06d0ed744d9b5737e9371a24c5e8334c041e2ca8737f

  console.log(newRandomGeneratorEvents)

  newRandomGeneratorEvents.forEach((newRandomGeneratorEvent) => {
    // extract transfer event arguments
      findings.push(
        Finding.fromObject({
          name: "New Random Generator",
          description: `: ${1}`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
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
