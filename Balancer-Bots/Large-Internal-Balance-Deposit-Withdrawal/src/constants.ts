// Monitored event.
export const EVENT = ["event InternalBalanceChanged(address indexed user, address indexed token, int256 delta)"];
export const TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
];
