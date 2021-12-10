import { utils } from "ethers";

const PROVIDER_ABI: string[] = [
  'function get_registry() external view returns (address registry)',
];
const PROVIDER_IFACE: utils.Interface = new utils.Interface(PROVIDER_ABI);

const REGISTRY_ABI: string[] = [
  'function get_pool_name(address pool) external view returns (string name)',
];
const REGISTRY_IFACE: utils.Interface = new utils.Interface(REGISTRY_ABI);

const POOL_EVENTS: string[] = [
  'event RampA(uint256 old_A, uint256 new_A, uint256 initial_time, uint256 future_time)',
  'event StopRampA(uint256 A, uint256 t)',
];
const POOL_IFACE: utils.Interface = new utils.Interface(POOL_EVENTS);

export default {
  PROVIDER_ABI,
  PROVIDER_IFACE,
  REGISTRY_ABI,
  REGISTRY_IFACE,
  POOL_EVENTS,
  POOL_IFACE,
};
