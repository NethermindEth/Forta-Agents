import { utils } from "ethers";

export const keeperRegistryInterface = new utils.Interface([
  "function getMinBalanceForUpkeep(uint256 keeperIndex) external view returns (uint256)",
  "function getUpkeep(uint256 keeperIndex) external view returns (address target, uint32 executeGas, bytes checkData, uint96 balance, address lastKeeper, address admin, uint64 maxValidBlockNumber)",
  "function performUpkeep(uint256 id, bytes data) external",
]);
