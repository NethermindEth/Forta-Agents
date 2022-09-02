import { Finding, HandleTransaction, TransactionEvent, ethers, Initialize, getEthersProvider } from "forta-agent";
import { FILLED_RELAY_EVENT } from "./ABI";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, DATA } from "./config";
import { createFinding } from "./findings";
import BN from "bignumber.js";
import { getTokenInfo } from "./utils";
import LRU from "lru-cache";

const networkManager = new NetworkManager(DATA);
const token_cache = new LRU<string, { tokenName: string; tokenDecimals: number }>({ max: 500 });

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
  provider: ethers.providers.Provider
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    //get the correct contract address for the network selected
    const spokePoolAddress = networkManager.get("spokePoolAddress");

    const findings: Finding[] = [];
    // filter the transaction logs for funds deposited events
    const filledRelayEvents = txEvent.filterLog(FILLED_RELAY_EVENT, spokePoolAddress);

    for (const filledRelayEvent of filledRelayEvents) {
      const {
        amount,
        originChainId,
        destinationChainId,
        destinationToken,
        depositor,
        relayer,
        recipient,
        isSlowRelay,
      } = filledRelayEvent.args;

      const tokenInfo: { tokenName: string; tokenDecimals: number } = await getTokenInfo(
        destinationToken,
        provider,
        token_cache,
        txEvent.blockNumber
      );

      const normalizedAmount = BN(amount.toString()).shiftedBy(-tokenInfo.tokenDecimals);

      const metadata = {
        amount: normalizedAmount.toString(10),
        originChainId: originChainId.toString(),
        destinationChainId: destinationChainId.toString(),
        tokenName: tokenInfo.tokenName,
        depositor,
        recipient,
        relayer,
      };

      findings.push(createFinding(metadata, isSlowRelay));
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager, getEthersProvider()),
  provideHandleTransaction,
};
