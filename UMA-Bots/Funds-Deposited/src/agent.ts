import { Finding, HandleTransaction, TransactionEvent, ethers, Initialize, getEthersProvider } from "forta-agent";
import { FUNC_ABI, FUNDS_DEPOSITED_EVENT } from "./ABI";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, DATA } from "./config";
import { createFinding } from "./findings";
import BN from "bignumber.js";
import LRU from "lru-cache";

const networkManager = new NetworkManager(DATA);
let cache = new LRU<string, {tokenName:string, tokenDecimals:number}>({ max: 500 });

async function getTokenInfo(address: string):Promise<{tokenName:string, tokenDecimals:number}> {
  
  let token = new ethers.Contract(address, FUNC_ABI, getEthersProvider());
  try {
    let tokenName:string = await token.name();
    let tokenDecimals:number = await token.decimals();
    return {tokenName, tokenDecimals}

  } catch (e) {}

  return {tokenName:"Test Token", tokenDecimals: 1}
}

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (networkManager: NetworkManager<NetworkData>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const spokePoolAddress = networkManager.get("spokePoolAddress");

    const findings: Finding[] = [];
    // filter the transaction logs for funds deposited events
    const fundsDepositedEvents = txEvent.filterLog(FUNDS_DEPOSITED_EVENT, spokePoolAddress);

    for (const fundsDepositedEvent of fundsDepositedEvents) {
      let { amount, originChainId, destinationChainId, originToken } = fundsDepositedEvent.args;

      let tokenInfo:{tokenName:string, tokenDecimals:number};

      if(!cache.has(originToken)){
        tokenInfo = await getTokenInfo(originToken);
        cache.set(originToken, tokenInfo)
      }
      else{
        tokenInfo = cache.get(originToken)!
      }

      let normalizedAmount = BN(amount.toString()).dividedBy(10 ** tokenInfo.tokenDecimals)

      let metadata = {
        amount: normalizedAmount.toString(),
        originChainId: originChainId.toString(),
        destinationChainId: destinationChainId.toString(),
        tokenName: tokenInfo.tokenName,
      };

      findings.push(createFinding(metadata));
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
  provideHandleTransaction,
};
