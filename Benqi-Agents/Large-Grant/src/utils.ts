export const QI_GRANTED_ABI = "event QiGranted(address recipient, uint amount)";
export const QI_BALANCE_ABI = "function balanceOf(address account) view returns (uint256)";

export const COMPTROLLER_ADDRESS = "0x486af39519b4dc9a7fccd318217352830e8ad9b4";
export const QI_ADDRESS = "0x8729438eb15e2c8b576fcc6aecda6a148776c0f5";

// ref. https://snowtrace.io/address/0x8729438eb15e2c8b576fcc6aecda6a148776c0f5#code
export const QI_TOTAL_SUPPLY = "7200000000000000000000000000";

export enum ThresholdMode {
  ABSOLUTE,
  PERCENTAGE_TOTAL_SUPPLY,
  PERCENTAGE_COMPTROLLER_BALANCE,
}

export interface AgentConfig {
  thresholdMode: ThresholdMode;
  threshold: string;
  qiAddress: string;
  comptrollerAddress: string;
}
