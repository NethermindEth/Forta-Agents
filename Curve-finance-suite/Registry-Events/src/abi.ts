const REGISTRY: string[] = [
  "event PoolAdded(address indexed pool, bytes rate_method_id)",
  'event PoolRemoved(address indexed pool)',
];

const PROVIDER: string[] = [
  "function get_registry() external view returns (address)",
];

export default{
  REGISTRY,
  PROVIDER,
};
