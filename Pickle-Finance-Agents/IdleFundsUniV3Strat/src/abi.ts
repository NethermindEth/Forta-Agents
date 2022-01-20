import { utils } from "ethers";

export const keeperInterface = new utils.Interface([
  "function strategyArray(uint256 index) external view returns (address)",
]);

export const strategyInterface = new utils.Interface([
  "function liquidityOfThis() external view returns (uint256)",
  "function liquidityOf() external view returns (uint256)",
]);
