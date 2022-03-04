import { ethers } from "ethers";

const FLEXA_ABI = [
  "function fallbackSetDate() view returns (uint256)",
  "function fallbackWithdrawalDelaySeconds() view returns (uint256)"
];

export const flexaInterface = new ethers.utils.Interface(FLEXA_ABI);
