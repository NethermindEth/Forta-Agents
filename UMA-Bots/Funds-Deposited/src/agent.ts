import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  ethers,
  Initialize,
  getEthersProvider
} from "forta-agent";

import {FUNDS_DEPOSITED_EVENT} from "./ABI";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, DATA } from "./config";
import { createFinding } from "./findings";

const networkManager = new NetworkManager(DATA);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (networkManager: NetworkManager<NetworkData>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const spokePoolAddress = networkManager.get("spokePoolAddress");
  const findings: Finding[] = [];

  // filter the transaction logs for funds deposited events
  const fundsDepositedEvents = txEvent.filterLog(
    FUNDS_DEPOSITED_EVENT,
    spokePoolAddress
  );

  fundsDepositedEvents.forEach((fundsDepositedEvent) => {


      findings.push(
          createFinding()
      );
    }
  )

  return findings;
};
}

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
