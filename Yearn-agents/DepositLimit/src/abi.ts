import { ethers } from "ethers";

const HELPER_ABI = ["function assetsAddresses() view returns (address[])"];

const VAULT_ABI = [
  "function totalAssets() view returns (uint256)",
  "function depositLimit() view returns (uint256)",
];

export const helperInterface = new ethers.utils.Interface(HELPER_ABI);
export const vaultInterface = new ethers.utils.Interface(VAULT_ABI);
