import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const TRANSFER_EVENT = "event Transfer(address indexed from, address indexed to, uint256 value)";
export const ERC20_ABI = ["function balanceOf(address account) external view returns (uint256)"];

export const GOERLI_MONITORED_ADDRESSES = [
  "0x1Abf3a6C41035C1d2A3c74ec22405B54450f5e13",
  "0x628bfE54739098012bDc282EFA2F74c226FF5d40",
];


/*
 * @param amount: amount of tokens transferred
 * @param addr: monitored wallet address
 * @param fundsIn: boolean value indicating whether the transfer was made in or out of monitored wallet address
 */
export function getFindingInstance(amount: string, walletAddr: string, tokenAddr: string, fundsIn: string) {
  return Finding.fromObject({
    name: "Large relayer tokens balance change",
    description: "A large amount of funds was transferred from a monitored relayer address",
    alertId: "UMA-9",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    protocol: "UMA",
    metadata: {
      amount,
      walletAddr,
      tokenAddr,
      fundsIn,
    },
  });
}

export const GOERLI_MONITORED_TOKENS = [
  "0x6b79C63a7d3ACF14272eB19B384046bAd9a3C6E2", // USDT
];

export const GOERLI_PERCENTAGE_CHANGE_THRESHOLD = 10;
