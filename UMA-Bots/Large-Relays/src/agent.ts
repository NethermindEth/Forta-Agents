import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { FILLED_RELAY_EVENT, getFindingInstance } from "./utils";
import { NetworkDataInterface, NM_DATA } from "./network";
import { BigNumber } from "ethers";

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
  filledRelayEvent: string,
  networkManager: NetworkManager<NetworkDataInterface>
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const filledRelayEventTxns = txEvent.filterLog(filledRelayEvent, networkManager.get("spokePoolAddr"));

    filledRelayEventTxns.forEach((filledRelayEvent) => {
      const { amount, originChainId, destinationChainId, depositor, recipient, isSlowRelay, destinationToken } =
        filledRelayEvent.args;

      if (
        Object.keys(networkManager.get("tokenThresholds")).includes(destinationToken) &&
        amount.gte(BigNumber.from(networkManager.get("tokenThresholds")[destinationToken]))
      ) {
        findings.push(
          getFindingInstance(
            amount.toString(),
            destinationToken,
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
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(FILLED_RELAY_EVENT, networkManager),
};
