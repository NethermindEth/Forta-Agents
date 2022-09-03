import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { NetworkDataInterface } from "./network";
import LRU from "lru-cache";

export const TRANSFER_EVENT = "event Transfer(address indexed from, address indexed to, uint256 value)";
export const ERC20_ABI = ["function balanceOf(address account) external view returns (uint256)"];

export const GOERLI_MONITORED_ADDRESSES = ["0x1Abf3a6C41035C1d2A3c74ec22405B54450f5e13"];

export interface Dictionary<T> {
  [Key: string]: T;
}

export async function loadLruCacheData(
  networkManager: NetworkManager<NetworkDataInterface>,
  provider: ethers.providers.Provider,
  lru: LRU<string, Dictionary<string>>
) {
  networkManager.get("monitoredTokens").forEach((token) => {
    let tokenContract = new ethers.Contract(token, ERC20_ABI, provider);
    networkManager.get("monitoredAddresses").forEach(async (address) => {
      let balance = await tokenContract.balanceOf(address);
      lru.set(token, { [address]: balance.toString() });
    });
  });
}

/*
 * @param amount: amount of tokens transferred
 * @param token: monitored wallet address
 * @param fundsIn: boolean value indicating whether the transfer was made in or out of monitored wallet address
 */
export function getFindingInstance(amount: string, addr: string, fundsIn: string) {
  return Finding.fromObject({
    name: "Large relayer tokens balance change",
    description: "A large amount of funds was transferred from a specific relayer address",
    alertId: "UMA-7",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    protocol: "UMA",
    metadata: {
      amount,
      addr,
      fundsIn,
    },
  });
}

// @Review Since the PoC addresses don't really need to be configurable by the client,
// is it better to add the Goerli addresses here or in chainThresholds.ts ?
export const GOERLI_MONITORED_TOKENS = [
  "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", // WETH
];
