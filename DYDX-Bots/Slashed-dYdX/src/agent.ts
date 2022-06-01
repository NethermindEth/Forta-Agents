import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { providers } from "ethers";
import NetworkData from "./network";
import NetworkManager, { NETWORK_MAP } from "./network";
import { SLASHED_EVENT } from "./utils";
import { createFinding } from "./findings";

const networkManager = new NetworkManager(NETWORK_MAP);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export function provideHandleTransaction(networkManager: NetworkData): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // If the Slashed event is emitted by
    // the Safety Module contract, create a finding
    txEvent.filterLog(SLASHED_EVENT, networkManager.safetyModule).forEach((log) => {
      findings.push(createFinding(log));
    });

    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
