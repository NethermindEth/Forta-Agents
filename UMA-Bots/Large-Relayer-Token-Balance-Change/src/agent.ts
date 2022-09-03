import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { TRANSFER_EVENT, getFindingInstance, Dictionary, loadLruCacheData } from "./utils";
import { NetworkDataInterface, NM_DATA } from "./network";
import LRU from "lru-cache";
import { BigNumber } from "ethers";

const networkManager = new NetworkManager(NM_DATA);
const thisLru = new LRU<string, Dictionary<string>>({ max: 1000 }); // token address => { wallet address => balance }

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

/**
 * @param {number} alertThreshold - minimum percentage change in token balance for a monitored address to trigger an alert
 */
export function provideHandleTransaction(
  transferEvent: string,
  networkManager: NetworkManager<NetworkDataInterface>,
  passedLru: LRU<string, Dictionary<string>>
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    // console.log(passedLru.get("0xb2Df4c3B89B71950399BD5B6b2fD71EDb0576E70"));
    // console.log(passedLru.get("0xdAC17F958D2ee523a2206206994597C13D831ec7"));
    // console.log(passedLru.get("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"));

    let alertThreshold = networkManager.get("alertThreshold");
    const findings: Finding[] = [];
    const transferEventTxns = txEvent.filterLog(transferEvent, networkManager.get("monitoredTokens")); // Transfer event transactions for monitored addresses

    transferEventTxns.forEach((transferEvent) => {
      const { from, to, value } = transferEvent.args;
      let fromLower = from.toLowerCase();
      let toLower = to.toLowerCase();
      let valueBN: BigNumber = BigNumber.from(value);

      if (networkManager.get("monitoredAddresses").includes(from)) {
        
        console.log("SIDHU 1");
        console.log(passedLru.get(transferEvent.address));
        console.log(fromLower);
        
        let prevBalance = BigNumber.from(passedLru.get(transferEvent.address)![fromLower]);
        console.log("SIDHU 2");
        if (valueBN.gte(prevBalance.mul(alertThreshold).div(100))) {
          findings.push(getFindingInstance(value.toString(), fromLower, "false"));
        }
        console.log("SIDHU 3");
        let pastDict = passedLru.get(transferEvent.address);
        pastDict![to] = prevBalance.sub(valueBN).toString();
        passedLru.set(transferEvent.address, pastDict!);
      } else if (networkManager.get("monitoredAddresses").includes(to)) {
        let toLower = from.toLowerCase();
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
