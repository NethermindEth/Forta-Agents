import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import { generateDictNameToAbi, getEventMetadata, HUBPOOL_MONITORED_EVENTS } from "./utils";
import { getFindingInstance } from "./helpers";
import { NetworkManager } from "forta-agent-tools";
import { NM_DATA, NetworkDataInterface } from "./network";

const networkManagerCurr = new NetworkManager(NM_DATA);

export function provideInitiallize(
  networkManager: NetworkManager<NetworkDataInterface>,
  provider: ethers.providers.Provider
): Initialize {
  return async () => {
    await networkManager.init(provider);
  };
}

export function provideHandleTransactionL1(
  monitoredHubPoolEvents: string[],
  networkManager: NetworkManager<NetworkDataInterface>
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    let eventNameToAbi = generateDictNameToAbi(monitoredHubPoolEvents);
    const findings: Finding[] = [];

    const relevantHubPoolEventTxns = txEvent.filterLog(monitoredHubPoolEvents, networkManager.get("hubPoolAddr"));
    relevantHubPoolEventTxns.forEach((actualEventTxn) => {
      let thisFindingMetadata = getEventMetadata(
        actualEventTxn.eventFragment.name,
        actualEventTxn.args,
        eventNameToAbi
        );
        findings.push(getFindingInstance(thisFindingMetadata));
      });
    return findings;
  };
}

export default {
  initialize: provideInitiallize(networkManagerCurr, getEthersProvider()),
  handleTransaction: provideHandleTransactionL1(HUBPOOL_MONITORED_EVENTS, networkManagerCurr),
};
