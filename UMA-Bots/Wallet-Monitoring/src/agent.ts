import {
  Finding,
  HandleTransaction,
  ethers,
  Initialize,
  TransactionEvent,
  getEthersProvider,
} from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { FILLED_RELAY_EVENT, getFindingInstance } from "./utils";
import { NetworkDataInterface, NM_DATA } from "./network";

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
  filledRelayEvent: string,
  networkManager: NetworkManager<NetworkDataInterface>
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const filledRelayEventTxns = txEvent.filterLog(
      filledRelayEvent,
      networkManager.get("hubPoolAddr")
    );

    filledRelayEventTxns.forEach((filledRelayEvent) => {
      const {
        amount,
        originChainId,
        destinationChainId,
        depositor,
        recipient,
        isSlowRelay,
      } = filledRelayEvent.args;

      if (networkManager.get("monitoredList").indexOf(depositor) > -1) {
        findings.push(
          getFindingInstance(
            amount.toString(),
            originChainId.toString(),
            destinationChainId.toString(),
            depositor,
            recipient,
            isSlowRelay.toString()
          )
        );
      }
    });
    return findings;
  };
}

export default {
  initialize: provideInitialize(networkManagerCurr, getEthersProvider()),
  handleTransaction: provideHandleTransaction(
    FILLED_RELAY_EVENT,
    networkManagerCurr
  ),
};
