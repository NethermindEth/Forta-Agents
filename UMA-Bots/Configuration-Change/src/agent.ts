import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import {
  getFindingInstance,
  generateDictNameToAbi,
  getEventMetadata,
  HUBPOOL_MONITORED_EVENTS,
  SPOKEPOOL_MONITORED_EVENTS,
} from "./utils";
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
  monitoredHubPoolEvents: string[],
  networkManager: NetworkManager<NetworkDataInterface>,
  monitoredSpokePoolEvents: string[]
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    // HubPool configurations
    if (networkManager.get("hubPoolAddr")) {
      const hubPoolEventTxns = txEvent.filterLog(monitoredHubPoolEvents, networkManager.get("hubPoolAddr"));
      if (hubPoolEventTxns.length > 0) {
        const eventNameToAbiHubPool = generateDictNameToAbi(monitoredHubPoolEvents);
        hubPoolEventTxns.forEach((actualEventTxn) => {
          let thisFindingMetadata = getEventMetadata(
            actualEventTxn.eventFragment.name,
            actualEventTxn.args,
            eventNameToAbiHubPool
          );
          findings.push(getFindingInstance(true, thisFindingMetadata));
        });
      }
    }
    // SpokePool configurations
    const spokePoolEventTxns = txEvent.filterLog(monitoredSpokePoolEvents, networkManager.get("spokePoolAddr"));
    if (spokePoolEventTxns.length > 0) {
      const eventNameToAbiSpokePool = generateDictNameToAbi(monitoredSpokePoolEvents);
      spokePoolEventTxns.forEach((actualEventTxn) => {
        let thisFindingMetadata = getEventMetadata(
          actualEventTxn.eventFragment.name,
          actualEventTxn.args,
          eventNameToAbiSpokePool
        );
        findings.push(getFindingInstance(false, thisFindingMetadata));
      });
    }
    return findings;
  };
}

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(HUBPOOL_MONITORED_EVENTS, networkManager, SPOKEPOOL_MONITORED_EVENTS),
};
