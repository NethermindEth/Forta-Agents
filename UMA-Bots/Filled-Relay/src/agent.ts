import { Finding, HandleTransaction, TransactionEvent, ethers, Initialize, getEthersProvider } from "forta-agent";
import { FUNC_ABI, FILLED_RELAY_EVENT } from "./ABI";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, DATA } from "./config";
import { createFinding } from "./findings";
import BN from "bignumber.js";
import LRU from "lru-cache";

const networkManager = new NetworkManager(DATA);
let cache = new LRU<string, { tokenName: string; tokenDecimals: number }>({ max: 500 });

async function getTokenInfo(
  address: string,
  provider: ethers.providers.Provider,
  blockNumber: number
): Promise<{ tokenName: string; tokenDecimals: number }> {
  //check if token address is already cached
  if (!cache.has(address)) {
    let token = new ethers.Contract(address, FUNC_ABI, provider);

    let [tokenName, tokenDecimals] = await Promise.all([
      token.name({ blockTag: blockNumber }),
      token.decimals({ blockTag: blockNumber }),
    ]);
    let info = { tokenName, tokenDecimals };
    //cache address -> token info
    cache.set(address, info);
    return info;
  } else {
    //return cached information
    return cache.get(address) as { tokenName: string; tokenDecimals: number };
  }
}

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

      let { amount, originChainId, destinationChainId, originToken, depositor, relayer, recipient } = filledRelayEvent.args;

      let tokenInfo: { tokenName: string; tokenDecimals: number };

      tokenInfo = await getTokenInfo(originToken, provider, txEvent.blockNumber);
      
      findings.push();
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager, getEthersProvider()),
  provideHandleTransaction,
};
