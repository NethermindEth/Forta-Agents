import { utils } from "ethers";

export const redeemHelperInterface = new utils.Interface([
  "function bonds(uint256 index) external view returns (address)",
]);
