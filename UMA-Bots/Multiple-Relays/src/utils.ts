import { ethers } from "forta-agent";
import { FUNC_ABI } from "./ABI";
import LRU from "lru-cache";

export async function getTokenInfo(
  address: string,
  provider: ethers.providers.Provider,
  cache: LRU<string, { tokenName: string; tokenDecimals: number }>,
  blockNumber: number
): Promise<{ tokenName: string; tokenDecimals: number }> {
  //check if token address is already cached
  if (!cache.has(address)) {
    let token = new ethers.Contract(address, FUNC_ABI, provider);
    let info: { tokenName: string; tokenDecimals: number };
    try {
      let [tokenName, tokenDecimals] = await Promise.all([
        token.name({ blockTag: blockNumber }),
        token.decimals({ blockTag: blockNumber }),
      ]);
      info = { tokenName, tokenDecimals };

      //cache address -> token info
      cache.set(address, info);
    } catch {
      info = { tokenName: "", tokenDecimals: 0 };
    }

    return info;
  } else {
    //return cached information
    return cache.get(address) as { tokenName: string; tokenDecimals: number };
  }
}
