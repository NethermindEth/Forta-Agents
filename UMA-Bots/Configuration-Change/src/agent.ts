import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import { getFindingInstance, HUBPOOL_MONITORED_EVENTS, SPOKEPOOL_MONITORED_EVENTS, getMetadata } from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { NM_DATA, NetworkDataInterface } from "./network";

const networkManager = new NetworkManager(NM_DATA);

export function provideInitialize(
  networkManager: NetworkManager<NetworkDataInterface>,
  provider: ethers.providers.Provider
): Initialize {
  return async () => {
    await networkManager.init(provider);
  };
}

export function provideHandleTransaction(
  networkManager: NetworkManager<NetworkDataInterface>
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    // HubPool configurations
    if (networkManager.get("hubPoolAddr")) {
      const hubPoolEventTxns = txEvent.filterLog(networkManager.get("monitoredHubPoolEvents")!, networkManager.get("hubPoolAddr"));
      hubPoolEventTxns.forEach((actualEventTxn) => {
        const args = getMetadata(actualEventTxn.args);
        const thisFindingMetadata = {
          event: actualEventTxn.name,
          args: args,
        };
        findings.push(getFindingInstance(true, thisFindingMetadata));
      });
    }

    // SpokePool configurations
    const spokePoolEventTxns = txEvent.filterLog(
      networkManager.get("monitoredSpokePoolEvents"),
      networkManager.get("spokePoolAddr")
    );
    spokePoolEventTxns.forEach((actualEventTxn) => {
      const args = getMetadata(actualEventTxn.args);
      const thisFindingMetadata = {
        event: actualEventTxn.name,
        args: args,
      };
      findings.push(getFindingInstance(false, thisFindingMetadata));
    });
    return findings;
  };
}

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
