export const QI_GRANTED_ABI = "event QiGranted(address recipient, uint amount)";
export const QI_TOTAL_SUPPLY_ABI = "function totalSupply() view returns (uint256)";
export const QI_BALANCE_ABI = "function balanceOf(address account) view returns (uint256)";

export const COMPTROLLER_ADDRESS = "0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4";
export const QI_ADDRESS = "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5";

export enum ThresholdMode {
  ABSOLUTE,
  PERCENTAGE_TOTAL_SUPPLY,
  PERCENTAGE_COMP_BALANCE,
}
