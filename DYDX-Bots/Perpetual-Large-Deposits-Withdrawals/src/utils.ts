// Monitored events.
export const EVENTS = [
  "event LogDeposit(address depositorEthKey, uint256 starkKey, uint256 vaultId, uint256 assetType, uint256 nonQuantizedAmount, uint256 quantizedAmount)",
  "event LogWithdrawalPerformed(uint256 ownerKey, uint256 assetType, uint256 nonQuantizedAmount, uint256 quantizedAmount, address recipient)",
  "event LogMintWithdrawalPerformed(uint256 ownerKey, uint256 assetType, uint256 nonQuantizedAmount, uint256 quantizedAmount, uint256 assetId)",
];

export const ERC20_TOKEN_ABI = ["function balanceOf(address account) external view returns (uint256)"];
