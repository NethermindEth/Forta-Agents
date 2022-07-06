import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  Initialize,
  ethers,
  getEthersProvider
} from "forta-agent";
import { NetworkManager } from "forta-agent-tools";

import {LOW_THRESHOLD, MEDIUM_THRESHOLD, HIGH_THRESHOLD} from "./constants"
import {DELEGATE_VOTES_CHANGED_EVENT} from "./abi"
import {createFinding} from "./findings"
import {NetworkData, DATA} from "./config"

const networkManager = new NetworkManager(DATA);

const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

const provideHandleTransaction = (networkManager:NetworkManager<NetworkData>):HandleTransaction => {
  return async (txEvent: TransactionEvent):Promise<Finding[]> => {
  const findings: Finding[] = [];

  const contractAddress = await networkManager.get("cakeAddress")

  // filter the transaction logs for events
  const delegateVotesChangedEvents = txEvent.filterLog(DELEGATE_VOTES_CHANGED_EVENT, contractAddress);

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
}

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
  provideHandleTransaction
};
