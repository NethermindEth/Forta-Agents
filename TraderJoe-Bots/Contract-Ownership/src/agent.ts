import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { providers } from "ethers";
import NetworkData from "./network";
import NetworkManager, { NETWORK_MAP } from "./network";
import { OWNERSHIP_TRANSFERRED_ABI } from "./utils";
import { createFinding } from "./findings";

const networkManager = new NetworkManager(NETWORK_MAP);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export function provideHandleTransaction(networkManager: NetworkData): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // If the `OwnershipTransferred` is emitted
    // by any of the monitored contracts,
    // create a finding.
    txEvent.filterLog(OWNERSHIP_TRANSFERRED_ABI, networkManager.monitoredContracts).forEach((log) => {
      findings.push(createFinding(log.name, log.args, log.address));
    });

    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
