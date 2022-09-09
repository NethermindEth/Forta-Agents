import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { TRANSFER_EVENT, getFindingInstance, Dictionary, loadLruCacheData } from "./utils";
import { NetworkDataInterface, NM_DATA } from "./network";
import LRU from "lru-cache";
import { BigNumber } from "ethers";

const networkManager = new NetworkManager(NM_DATA);
const thisLru = new LRU<string, Dictionary<string>>({ max: 10000 }); // token address => { wallet address => balance }

export function provideInitialize(
  networkManager: NetworkManager<NetworkDataInterface>,
  provider: ethers.providers.Provider,
  passedLru: LRU<string, Dictionary<string>>
): Initialize {
  return async () => {
    await networkManager.init(provider);
    await loadLruCacheData(networkManager, provider, passedLru);
  };
}

export function provideHandleTransaction(
  transferEvent: string,
  networkManager: NetworkManager<NetworkDataInterface>,
  passedLru: LRU<string, Dictionary<string>>
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
        if (valueBN.gte(prevBalance.mul(alertThreshold).div(100))) {
          findings.push(getFindingInstance(value.toString(), from, "false"));
        }
        let pastDict = passedLru.get(transferEvent.address);
        pastDict![to] = prevBalance.sub(valueBN).toString();
        passedLru.set(transferEvent.address, pastDict!);
      }
      if (networkManager.get("monitoredAddresses").includes(to)) {
        let prevBalance = BigNumber.from(passedLru.get(transferEvent.address)![to]);
        if (valueBN.gte(prevBalance.mul(alertThreshold).div(100))) {
          findings.push(getFindingInstance(value.toString(), to, "true"));
        }
        let pastDict = passedLru.get(transferEvent.address);
        pastDict![to] = prevBalance.add(valueBN).toString();
        passedLru.set(transferEvent.address, pastDict!);
      }
    });
    return findings;
  };
}

export default {
  initialize: provideInitialize(networkManager, getEthersProvider(), thisLru),
  handleTransaction: provideHandleTransaction(TRANSFER_EVENT, networkManager, thisLru),
};
