import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import { EVENT_NAME_TO_ABI, generateDictNameToAbi, getEventMetadata, MONITORED_EVENTS } from "./utils";
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

export function provideHandleTransaction(
  monitoredEvents: string[],
  networkManager: NetworkManager<NetworkDataInterface>
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    let eventNameToAbi = generateDictNameToAbi(monitoredEvents);
    const findings: Finding[] = [];
    const relevantEventTxns = txEvent.filterLog(monitoredEvents, networkManager.get("hubPoolAddr"));
    relevantEventTxns.forEach((actualEventTxn) => {
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
  handleTransaction: provideHandleTransaction(MONITORED_EVENTS, networkManagerCurr),
};
