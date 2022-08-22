import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import { DISPUTE_EVENT, HUBPOOL_ADDRESS, MONITORED_EVENTS } from "./constants";
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
    const findings: Finding[] = [];
    const relevantEventTxns = txEvent.filterLog(monitoredEvents, networkManager.get("hubPoolAddr"));
    relevantEventTxns.forEach((actualEventTxn) => {
      const { disputer, requestTime } = actualEventTxn.args;
      findings.push(getFindingInstance(disputer.toString(), requestTime.toString()));
    });
    return findings;
  };
}

export default {
  initialize: provideInitiallize(networkManagerCurr, getEthersProvider()),
  handleTransaction: provideHandleTransaction(MONITORED_EVENTS, networkManagerCurr),
};
