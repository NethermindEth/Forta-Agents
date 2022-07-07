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

import { LOW_THRESHOLD, MEDIUM_THRESHOLD, HIGH_THRESHOLD, BN, DECIMALS, MIN_PREVIOUS_BALANCE } from "./thresholds";
import { DELEGATE_VOTES_CHANGED_EVENT } from "./abi";
import { createFinding } from "./findings";
import { NetworkData, DATA } from "./config";

const networkManager: NetworkManager<NetworkData> = new NetworkManager(DATA);

const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
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

      let delta: ethers.BigNumber = newBalance.sub(previousBalance).div(DECIMALS); // difference between balances

      if (MIN_PREVIOUS_BALANCE.lte(previousBalance)) {
        let deltaPercentage: number = delta.toNumber() / previousBalance.div(DECIMALS).toNumber(); //percentage of vote increase

        if (deltaPercentage >= HIGH_THRESHOLD) {
          findings.push(createFinding((deltaPercentage * 100).toString(), metadata, FindingSeverity.High));
        } else if (deltaPercentage >= MEDIUM_THRESHOLD) {
          findings.push(createFinding((deltaPercentage * 100).toString(), metadata, FindingSeverity.Medium));
        } else if (deltaPercentage >= LOW_THRESHOLD) {
          findings.push(createFinding((deltaPercentage * 100).toString(), metadata, FindingSeverity.Low));
        }
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
