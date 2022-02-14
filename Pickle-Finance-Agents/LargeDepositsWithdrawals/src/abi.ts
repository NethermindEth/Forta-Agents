const VAULT: string[] = [
  "function totalSupply() view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const REGISTRY: string[] = [
  "function developmentVaults() view returns (address[])",
  "function productionVaults() view returns (address[])",
];

export default {
  VAULT,
  REGISTRY,
};
