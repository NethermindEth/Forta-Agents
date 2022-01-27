import { ethers } from "ethers";

export const vaultInterface = new ethers.utils.Interface([
  "function withdraw(uint256 maxShares)",
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
]);

export const vaultRegistryInterface = new ethers.utils.Interface([
  "function assetsAddresses() external view returns (address[])",
]);
