import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { TRANSFER_EVENT, getFindingInstance, Dictionary, ERC20_ABI, loadLruCacheData } from "./utils";
import { NetworkDataInterface, NM_DATA } from "./network";
import LRU from "lru-cache";
import { PERCENTAGE_CHANGE_THRESHOLD } from "./configurables";
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
  passedLru: LRU<string, Dictionary<string>>,
  alertThreshold: number
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    // console.log(passedLru.get("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"));
    // console.log(passedLru.get("0xdAC17F958D2ee523a2206206994597C13D831ec7"));
    // console.log(passedLru.get("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"));
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
      } else if (networkManager.get("monitoredAddresses").includes(to)) {
        // console.log(passedLru.get(transferEvent.address)![to]);
        let prevBalance = BigNumber.from(passedLru.get(transferEvent.address)![to]);
        // console.log(prevBalance);
        
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
  handleTransaction: provideHandleTransaction(TRANSFER_EVENT, networkManager, thisLru, PERCENTAGE_CHANGE_THRESHOLD),
};
