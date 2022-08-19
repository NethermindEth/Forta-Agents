import {
  Finding,
  HandleTransaction,
  ethers,
  Initialize,
  TransactionEvent,
  getEthersProvider,
} from "forta-agent";
import { DISPUTE_EVENT, HUBPOOL_ADDRESS } from "./constants";
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
  disputeEvent: string,
  networkManager: NetworkManager<NetworkDataInterface>
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const disputeEventTxns = txEvent.filterLog(disputeEvent, networkManager.get("hubPoolAddr"));
    disputeEventTxns.forEach((disputeActualEvent) => {
      const { disputer, requestTime } = disputeActualEvent.args;
      findings.push(getFindingInstance(disputer.toString(), requestTime.toString()));
    });
    return findings;
  };
}

export default {
  initialize: provideInitiallize(networkManagerCurr, getEthersProvider()),
  handleTransaction: provideHandleTransaction(DISPUTE_EVENT, networkManagerCurr),
};
