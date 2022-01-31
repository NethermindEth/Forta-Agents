import { utils } from "ethers";

export const workerInterface = new utils.Interface([
  "function masterChef() external view returns (address)",
  "function bscPool() external view returns (address)",
  "function wexMaster() external view returns (address)",
  "function pid() external view returns (uint256)",
  "function lpToken() external view returns (address)",
]);

export const positionManagerInterface = new utils.Interface([
  "function userInfo(uint256 id, address account) external view returns (uint256 amount, uint256 rewardDebt)",
]);

export const tokenInterface = new utils.Interface([
  "function totalSupply() external view returns (uint256)",
]);
