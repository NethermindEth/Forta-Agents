import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
} from "forta-agent";

import {LOW_THRESHOLD, MEDIUM_THRESHOLD, HIGH_THRESHOLD} from "./constants"
import {CAKE_ADDRESS, DELEGATE_VOTES_CHANGED_EVENT} from "./abi"
import {createFinding} from "./findings"


const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  // filter the transaction logs for events
  const delegateVotesChangedEvents = txEvent.filterLog(DELEGATE_VOTES_CHANGED_EVENT, CAKE_ADDRESS);

  delegateVotesChangedEvents.forEach((delegateVotesChangedEvent) => {
    // extract event arguments
    const { delegate, previousBalance, newBalance } = delegateVotesChangedEvent.args;
    let metadata = {
      delegate,
      previousBalance,
      newBalance
    }

    let delta = newBalance - previousBalance; // difference between balances

    // if delta is over the threshold create finding accordingly
    if (delta >= HIGH_THRESHOLD) {

      findings.push(createFinding(delegateVotesChangedEvent.name, metadata, FindingSeverity.High));
    }
    else if(delta >= MEDIUM_THRESHOLD){
      findings.push(createFinding(delegateVotesChangedEvent.name, metadata, FindingSeverity.Medium));
    }
    else if(delta >= LOW_THRESHOLD){
      findings.push(createFinding(delegateVotesChangedEvent.name, metadata, FindingSeverity.Low
        ));
    }

  });

  return findings;
};

export default {
  handleTransaction
};
