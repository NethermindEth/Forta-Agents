import LRUCache from "lru-cache";
import { routerInterface, tokenInterface } from "./abi";
import { BigNumber, providers, Contract } from "ethers";
import axios from "axios";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

const cache = new LRUCache<string, BigNumber>({ max: 10000 });

export type PoolInfo = {
  address: string;
  principal: string;
};


export const getPrice = async (
  amount: BigNumber,
  tokenToPrice: string,
  denomination: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<BigNumber> => {
  if (tokenToPrice === denomination) {
    return BigNumber.from(1);
  }

  const cacheKey = `${tokenToPrice}~${denomination}~${amount.toString()}~${blockNumber}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as BigNumber;
  }

  const pancakeSwap = "0x10ed43c718714eb63d5aa57b78b54704e256024e";

  const routerContract = new Contract(pancakeSwap, routerInterface, provider);

  const price = (
    await routerContract.getAmountsOut(amount, [tokenToPrice, denomination], {
      blockTag: blockNumber,
    })
  )[1];

  cache.set(cacheKey, price);

  return price;
};

export type Fetcher = (url: string) => Promise<PoolInfo[]>;

export const fetchPools: Fetcher = async (url) => {
  const data = (await axios.get(url)).data;

  const lpTokens: PoolInfo[] = [];
  const lpTokensChecked = new Set<string>();

  for (let vault of data.Vaults) {
    const principal = vault.baseToken;

    for (let worker of vault.workers) {
      if (lpTokensChecked.has(worker.stakingToken)) {
        continue;
      }

      lpTokensChecked.add(worker.stakingToken);
      lpTokens.push({ address: worker.stakingToken, principal: principal });
    }
  }

  return lpTokens;
};

export const getTokenBalance = async (
  token: string,
  account: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<BigNumber> => {
  const tokenContract = new Contract(token, tokenInterface, provider);
  return tokenContract.balanceOf(account, { blockTag: blockNumber });
};

export const createFinding = (pool: string, tvl: string): Finding => {
  return Finding.fromObject({
    name: "Pool with low TVL",
    description: "An investment pool with low TVL was detected",
    alertId: "ALPACA-7",
    protocol: "Alpaca Finance",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      pool: pool,
      TVL: tvl,
    } 
  });
}
