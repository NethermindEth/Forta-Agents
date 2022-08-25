import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import {
  getFindingInstance,
  generateDictNameToAbi,
  getEventMetadata,
  HUBPOOL_MONITORED_EVENTS,
  SPOKEPOOL_MONITORED_EVENTS,
} from "./utils";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { NM_DATA, NetworkDataInterface } from "./network";

const networkManagerCurr = new NetworkManager(NM_DATA);

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
    let eventNameToAbiHubPool = generateDictNameToAbi(monitoredHubPoolEvents);
    let eventNameToAbiSpokePool = generateDictNameToAbi(monitoredSpokePoolEvents);
    const findings: Finding[] = [];
    // HubPool configurations
    if (networkManager.get("hubPoolAddr") != createAddress("0x00")) {
      const hubPoolEventTxns = txEvent.filterLog(monitoredHubPoolEvents, networkManager.get("hubPoolAddr"));
      hubPoolEventTxns.forEach((actualEventTxn) => {
        let thisFindingMetadata = getEventMetadata(
          actualEventTxn.eventFragment.name,
          actualEventTxn.args,
          eventNameToAbiHubPool
        );
        findings.push(getFindingInstance(true, thisFindingMetadata));
      });
    }
    // SpokePool configurations
    const spokePoolEventTxns = txEvent.filterLog(monitoredSpokePoolEvents, networkManager.get("spokePoolAddr"));
    spokePoolEventTxns.forEach((actualEventTxn) => {
      let thisFindingMetadata = getEventMetadata(
        actualEventTxn.eventFragment.name,
        actualEventTxn.args,
        eventNameToAbiSpokePool
      );
      findings.push(getFindingInstance(false, thisFindingMetadata));
    });
    return findings;
  };
}

export default {
  initialize: provideInitialize(networkManagerCurr, getEthersProvider()),
  handleTransaction: provideHandleTransaction(HUBPOOL_MONITORED_EVENTS, networkManagerCurr, SPOKEPOOL_MONITORED_EVENTS),
};
