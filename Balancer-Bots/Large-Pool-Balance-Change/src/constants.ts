// Monitored event.
export const EVENT = [
  "event PoolBalanceChanged(bytes32 indexed poolId, address indexed liquidityProvider, address[] tokens, int256[] deltas, uint256[] protocolFeeAmounts)",
];
export const TOKEN_ABI = [
  "function getPoolTokens(bytes32 poolId) external view returns (address[] memory, uint256[] memory, uint256)",
  "function symbol() external view returns (string)",
];
