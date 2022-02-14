import { utils } from "ethers";

export const pickleJarInterface = new utils.Interface([
  "function balance() public view returns (uint256)",
  "function available() public view returns (uint256)",
  "function name() public view returns (string)",
  "function liquidityOfThis() public view returns (uint256)",
  "function totalLiquidity() public view returns (uint256)",
]);

export const pickleRegistryInterface = new utils.Interface([
  "function developmentVaults() external view returns (address[] memory)",
  "function productionVaults() external view returns (address[] memory)",
]);
