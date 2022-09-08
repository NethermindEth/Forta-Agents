import BN from "bignumber.js";
import { ethers, Finding, getEthersProvider, HandleTransaction, Initialize, TransactionEvent } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import LRU from "lru-cache";
import { FILLED_RELAY_EVENT } from "./ABI";
import { DATA, NetworkData } from "./config";
import { createFinding, FINDING_PARAMETERS } from "./findings";
import { getTokenInfo } from "./utils";

const networkManager = new NetworkManager(DATA);
let tokenCache = new LRU<string, { tokenName: string; tokenDecimals: number }>({ max: 500 });

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider,
  relayerCache: LRU<string, { counter: number; timeStamp: number }>
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    //get the correct contract address for the network selected
    const spokePoolAddress = networkManager.get("spokePoolAddress");

    const findings: Finding[] = [];
    // filter the transaction logs for filled relay events
    const filledRelayEvents = txEvent.filterLog(FILLED_RELAY_EVENT, spokePoolAddress);

    for (const filledRelayEvent of filledRelayEvents) {
      let { amount, originChainId, destinationChainId, destinationToken, depositor, relayer, recipient } =
        filledRelayEvent.args;

      let tokenInfo: { tokenName: string; tokenDecimals: number };
      tokenInfo = await getTokenInfo(destinationToken, provider, tokenCache, txEvent.blockNumber);

      let normalizedAmount = BN(amount.toString()).shiftedBy(-tokenInfo.tokenDecimals);

      let metadata = {
        amount: normalizedAmount.toString(10),
        originChainId: originChainId.toString(),
        destinationChainId: destinationChainId.toString(),
        tokenName: tokenInfo.tokenName,
        depositor,
        recipient,
        relayer,
      };

      if (!relayerCache.has(relayer)) {
        relayerCache.set(relayer, { counter: 1, timeStamp: txEvent.timestamp });
      } else {
        let { counter, timeStamp } = relayerCache.get(relayer) as { counter: number; timeStamp: number };
        const delta = txEvent.timestamp - timeStamp;

        if (delta >= FINDING_PARAMETERS.timeWindow) {
          relayerCache.set(relayer, { counter: 0, timeStamp: txEvent.timestamp });
          counter = 0;
          timeStamp = txEvent.timestamp;
        }

        relayerCache.set(relayer, { counter: ++counter, timeStamp: timeStamp });

        if (counter >= FINDING_PARAMETERS.threshold) {
          findings.push(createFinding(metadata, delta / 60));
          relayerCache.set(relayer, { counter: 0, timeStamp: txEvent.timestamp });
        }
      }
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(
    networkManager,
    getEthersProvider(),
    new LRU<string, { counter: number; timeStamp: number }>({ max: 10000 })
  ),
  provideHandleTransaction,
};
