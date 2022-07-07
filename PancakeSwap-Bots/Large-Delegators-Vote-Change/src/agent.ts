import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  Initialize,
  ethers,
  getEthersProvider,
  LogDescription,
} from "forta-agent";
import { NetworkManager } from "forta-agent-tools";

import { LOW_THRESHOLD, MEDIUM_THRESHOLD, HIGH_THRESHOLD, BN, DECIMALS } from "./thresholds";
import { DELEGATE_VOTES_CHANGED_EVENT } from "./abi";
import { createFinding } from "./findings";
import { NetworkData, DATA } from "./config";

const networkManager: NetworkManager<NetworkData> = new NetworkManager(DATA);

const provideInitialize = (networkManager: NetworkManager<NetworkData>): Initialize => {
  return async () => {
    await networkManager.init(getEthersProvider());
  };
};

const provideHandleTransaction = (networkManager: NetworkManager<NetworkData>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const contractAddress: string = networkManager.get("cakeAddress");

    // filter the transaction logs for events
    const delegateVotesChangedEvents: LogDescription[] = txEvent.filterLog(
      DELEGATE_VOTES_CHANGED_EVENT,
      contractAddress
    );

    delegateVotesChangedEvents.forEach((delegateVotesChangedEvent) => {
      // extract event arguments
      const { delegate, previousBalance, newBalance } = delegateVotesChangedEvent.args;

      let metadata = {
        delegate,
        previousBalance: previousBalance.toString(),
        newBalance: newBalance.toString(),
      };

      let delta: ethers.BigNumber = BN.from(newBalance).sub(BN.from(previousBalance)); // difference between balances

      let normalizedDelta = delta.div(DECIMALS);

      // if delta is over the threshold create finding accordingly
      if (BN.from(delta).gte(HIGH_THRESHOLD)) {
        findings.push(createFinding(normalizedDelta.toString(), metadata, FindingSeverity.High));
      } else if (BN.from(delta).gte(MEDIUM_THRESHOLD)) {
        findings.push(createFinding(normalizedDelta.toString(), metadata, FindingSeverity.Medium));
      } else if (BN.from(delta).gte(LOW_THRESHOLD)) {
        findings.push(createFinding(normalizedDelta.toString(), metadata, FindingSeverity.Low));
      }
    });

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager),
  handleTransaction: provideHandleTransaction(networkManager),
  provideHandleTransaction,
};
