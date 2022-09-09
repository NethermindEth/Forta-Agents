import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { TRANSFER_EVENT, getFindingInstance, loadLruCacheData } from "./utils";
import { NetworkDataInterface, NM_DATA } from "./network";
import LRU from "lru-cache";
import { BigNumber } from "ethers";

const networkManager = new NetworkManager(NM_DATA);
const thisLru = new LRU<string, Record<string, BigNumber>>({ max: 10000 }); // token address => { wallet address => balance }

export function provideInitialize(
  networkManager: NetworkManager<NetworkDataInterface>,
  provider: ethers.providers.Provider,
  passedLru: LRU<string, Record<string, BigNumber>>
): Initialize {
  return async () => {
    await networkManager.init(provider);
    await loadLruCacheData(networkManager, provider, passedLru);
  };
}

export function provideHandleTransaction(
  transferEvent: string,
  networkManager: NetworkManager<NetworkDataInterface>,
  passedLru: LRU<string, Record<string, BigNumber>>
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    let alertThreshold = networkManager.get("alertThreshold");
    const findings: Finding[] = [];
    const transferEventTxns = txEvent.filterLog(transferEvent, networkManager.get("monitoredTokens")); // Transfer event transactions for monitored addresses
    transferEventTxns.forEach((transferEvent) => {
      const { from, to, value } = transferEvent.args;
      let valueBN: BigNumber = BigNumber.from(value);

      if (networkManager.get("monitoredAddresses").includes(from)) {
        let prevBalance = BigNumber.from(passedLru.get(transferEvent.address)![from]);
        if (valueBN.mul(100).gte(prevBalance.mul(alertThreshold))) {
          findings.push(getFindingInstance(value.toString(), from, transferEvent.address, "false"));
        }
        let pastDict : Record<string, BigNumber> = passedLru.get(transferEvent.address)!;
        pastDict[from] = prevBalance.sub(valueBN);
        passedLru.set(transferEvent.address, pastDict);
      }
      if (networkManager.get("monitoredAddresses").includes(to)) {
        let prevBalance = passedLru.get(transferEvent.address)![to];
        if (valueBN.mul(100).gte(prevBalance.mul(alertThreshold))) {
          findings.push(getFindingInstance(value.toString(), to,transferEvent.address, "true"));
        }
        let pastDict = passedLru.get(transferEvent.address)!;
        pastDict[to] = prevBalance.add(valueBN);
        passedLru.set(transferEvent.address, pastDict);
      }
    });
    return findings;
  };
}

export default {
  initialize: provideInitialize(networkManager, getEthersProvider(), thisLru),
  handleTransaction: provideHandleTransaction(TRANSFER_EVENT, networkManager, thisLru),
};
