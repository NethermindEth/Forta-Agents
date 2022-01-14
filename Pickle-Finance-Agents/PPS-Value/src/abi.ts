const VAULT: string[] = [
  "function getRatio() view returns (uint256)",
];

const REGISTRY: string[] = [
  "function developmentVaults() view returns (address[])",
  "function productionVaults() external view returns (address[])",
];

export default {
  VAULT,
  REGISTRY,
};
