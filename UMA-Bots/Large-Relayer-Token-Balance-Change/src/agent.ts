import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { TRANSFER_EVENT, getFindingInstance, Dictionary, ERC20_ABI, loadLruCacheData } from "./utils";
import { NetworkDataInterface, NM_DATA } from "./network";
import LRU from "lru-cache";
import { PERCENTAGE_CHANGE_THRESHOLD } from "./configAddresses";

const networkManager = new NetworkManager(NM_DATA);
const lru = new LRU<string, Dictionary<string>>({ max: 1000 }); // token address => { wallet address => balance }

export function provideInitialize(
  networkManager: NetworkManager<NetworkDataInterface>,
  provider: ethers.providers.Provider
): Initialize {
  return async () => {
    await networkManager.init(provider);
    await loadLruCacheData(networkManager, provider, lru);
  };
}

export function provideHandleTransaction(
  transferEvent: string,
  networkManager: NetworkManager<NetworkDataInterface>
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const transferEventTxns = txEvent.filterLog(transferEvent, networkManager.get("monitoredTokens")); // Transfer event transactions for monitored addresses

    transferEventTxns.forEach((transferEvent) => {
      const { from, to, amount } = transferEvent.args;

      if (networkManager.get("monitoredAddresses").includes(from)) {
        let prevBalance = parseFloat(lru.get(transferEvent.address)![from]);
        if (amount > PERCENTAGE_CHANGE_THRESHOLD * prevBalance) {
          findings.push(getFindingInstance(amount.toString(), from, "false"));
        }
      } else if (networkManager.get("monitoredAddresses").includes(to)) {
        let prevBalance = parseFloat(lru.get(transferEvent.address)![to]);
        if (amount > PERCENTAGE_CHANGE_THRESHOLD * prevBalance) {
          findings.push(getFindingInstance(amount.toString(), to, "true"));
        }
      }
    });
    return findings;
  };
}

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(TRANSFER_EVENT, networkManager),
};
