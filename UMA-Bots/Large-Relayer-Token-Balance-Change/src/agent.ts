import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { TRANSFER_EVENT, getFindingInstance, loadDataForToken } from "./utils";
import { NetworkDataInterface, NM_DATA } from "./network";
import LRU from "lru-cache";
import { BigNumber } from "ethers";

const networkManager = new NetworkManager(NM_DATA);
const thisLru = new LRU<string, Record<string, BigNumber>>({ max: 10000 }); // token address => { wallet address => balance }

export function provideInitialize(
  networkManager: NetworkManager<NetworkDataInterface>,
  provider: ethers.providers.Provider
): Initialize {
  return async () => {
    await networkManager.init(provider);
  };
}

export function provideHandleTransaction(
  transferEvent: string,
  networkManager: NetworkManager<NetworkDataInterface>,
  passedLru: LRU<string, Record<string, BigNumber>>,
  provider: ethers.providers.Provider
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    let alertThreshold = networkManager.get("alertThreshold");
    const findings: Finding[] = [];
    const transferEventTxns = txEvent.filterLog(transferEvent, networkManager.get("monitoredTokens")); // Transfer event transactions for monitored addresses
    transferEventTxns.forEach(async (transferEvent) => {
      const { from, to, value } = transferEvent.args;
      let valueBN: BigNumber = BigNumber.from(value);
      if (!networkManager.get("monitoredTokens").includes(transferEvent.address)) {
        return findings;
      }
      if (networkManager.get("monitoredAddresses").includes(from)) {
        if (!passedLru.has(transferEvent.address)) {
          await loadDataForToken(networkManager, provider, passedLru, transferEvent.address);
        }
        console.log(transferEvent.address);
        let prevBalance = BigNumber.from(passedLru.get(transferEvent.address)![from]);
        console.log(prevBalance);
        console.log(valueBN);
        if (valueBN.mul(100).gte(prevBalance.mul(alertThreshold))) {
          findings.push(getFindingInstance(value.toString(), from, transferEvent.address, "false"));
        }
        let pastDict: Record<string, BigNumber> = passedLru.get(transferEvent.address)!;
        pastDict[from] = prevBalance.sub(valueBN);
        passedLru.set(transferEvent.address, pastDict);
      }

      if (networkManager.get("monitoredAddresses").includes(to)) {
        if (!passedLru.has(transferEvent.address)) {
          await loadDataForToken(networkManager, provider, passedLru, transferEvent.address);
        }

        let prevBalance = passedLru.get(transferEvent.address)![to];
        if (valueBN.mul(100).gte(prevBalance.mul(alertThreshold))) {
          findings.push(getFindingInstance(value.toString(), to, transferEvent.address, "true"));
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
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(TRANSFER_EVENT, networkManager, thisLru, getEthersProvider()),
};
