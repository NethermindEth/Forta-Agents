import {
  ethers, Finding, FindingSeverity, getEthersProvider, HandleTransaction, Initialize, LogDescription, TransactionEvent
} from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import BN from "bignumber.js";
import { DELEGATE_VOTES_CHANGED_EVENT } from "./abi";
import { DATA, NetworkData } from "./config";
import { createFinding } from "./findings";
import {
  ABSOLUTE_THRESHOLD, DECIMALS, HIGH_THRESHOLD, LOW_THRESHOLD,
  MEDIUM_THRESHOLD, MIN_PREVIOUS_BALANCE
} from "./thresholds";

const networkManager: NetworkManager<NetworkData> = new NetworkManager(DATA);

const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    BN.set({DECIMAL_PLACES: 5});
    await networkManager.init(provider);
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

      let delta:BN = new BN(newBalance.toString()).minus(previousBalance.toString()); // difference between balances

      if (MIN_PREVIOUS_BALANCE.lt(previousBalance.toString())) {
        let deltaPercentage:BN = delta.dividedBy(new BN(previousBalance.toString())) // previousBalance.div(DECIMALS).toNumber(); //percentage of vote increase

        let description: string = deltaPercentage.multipliedBy(100).toString() + " %";

        if (deltaPercentage.gte(HIGH_THRESHOLD)) {
          findings.push(createFinding(description, metadata, FindingSeverity.High));
        } else if (deltaPercentage.gte(MEDIUM_THRESHOLD)) {
          findings.push(createFinding(description, metadata, FindingSeverity.Medium));
        } else if (deltaPercentage.gte(LOW_THRESHOLD)) {
          findings.push(createFinding(description, metadata, FindingSeverity.Low));
        }
      } else if (previousBalance.eq(0) && ABSOLUTE_THRESHOLD.lte(newBalance.toString())) {
        findings.push(createFinding(newBalance, metadata, FindingSeverity.Info));
      }
    });

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
  provideHandleTransaction,
};
