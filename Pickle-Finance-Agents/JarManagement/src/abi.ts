import { utils } from "ethers";

export const pickleJarInterface = new utils.Interface([
  "function setMin(uint256 min) external",
  "function setGovernance(address governance) external",
  "function setTimelock(address timelock) external",
  "function setController(address controller) external",
  "function setPaused(bool paused) external",
  "function setEarnAfterDeposit(bool setEarnAfterDeposit) external",
]);

export const pickleRegistryInterface = new utils.Interface([
  "function developmentVaults() external view returns (address[] memory)",
  "function productionVaults() external view returns (address[] memory)",
]);
