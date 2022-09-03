import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { NetworkDataInterface } from "./network";
import LRU from "lru-cache";

export const TRANSFER_EVENT = "event Transfer(address indexed from, address indexed to, uint256 value)";
export const ERC20_ABI = ["function balanceOf(address account) external view returns (uint256)"];

export const GOERLI_MONITORED_ADDRESSES = [
  "0x1Abf3a6C41035C1d2A3c74ec22405B54450f5e13",
  "0x628bfE54739098012bDc282EFA2F74c226FF5d40",
];

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
    let tokenDict : Dictionary<string> =  {} ;
    networkManager.get("monitoredAddresses").forEach(async (address) => {
      let balance = await tokenContract.balanceOf(address);
      tokenDict[address.toLowerCase()] = balance.toString();
    });
    lru.set(token.toLowerCase(), tokenDict);
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

export const GOERLI_MONITORED_TOKENS = [
  "0xb2Df4c3B89B71950399BD5B6b2fD71EDb0576E70", // USDT
];
