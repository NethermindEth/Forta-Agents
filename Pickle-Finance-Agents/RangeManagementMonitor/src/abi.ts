const KEEPER: string[] = [
  "function strategyArray(uint256 index) view returns (address strat)",
];

const STRATEGY: string[] = [
  "function tick_lower() view returns (int24 tick)",
  "function tick_upper() view returns (int24 tick)",
  "function pool() view returns (address pool)",
];

const POOL: string[] = [
  "function slot0() view returns (uint160, int24, uint16, uint16, uint8, bool)",
]

export default {
  KEEPER,
  STRATEGY,
  POOL,
};
