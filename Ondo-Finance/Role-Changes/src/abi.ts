import { utils } from "ethers";

const REGISTRY: string[] = [
  "function addStrategist(address _strategist, string calldata _name) external",
  "function grantRole(bytes32 role, address account) external",
  "function renounceRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
];

const REGISTRY_IFACE: utils.Interface = new utils.Interface(REGISTRY);

export default {
  REGISTRY,
  REGISTRY_IFACE,
};
