import { utils } from "ethers";

export const routerInterface = new utils.Interface([
  "function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)",
]);

export const tokenInterface = new utils.Interface([
  "function balanceOf(address account) external view returns (uint256 balance)",
]);
