import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const TRANSFER_EVENT = "event Transfer(address indexed from, address indexed to, uint256 value)";
export const ERC20_ABI = ["function balanceOf(address account) external view returns (uint256)"];

/*
 * @param amount: amount of tokens transferred
 * @param walletAddr: the monitored relayer address involved in the transfer
 * @param tokenAddr: the address of the transferred token
 * @param fundsIn: boolean value indicating whether the transfer was made in or out of monitored wallet address
 */
export function getFindingInstance(amount: string, walletAddr: string, tokenAddr: string, fundsIn: string) {
  return Finding.fromObject({
    name: "Large relayer tokens balance change",
    description: "A monitored relayer address was involved in a large transfer of funds",
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
