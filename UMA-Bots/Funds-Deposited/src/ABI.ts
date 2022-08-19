export const FUNDS_DEPOSITED_EVENT =
  "event FundsDeposited(uint256 amount, uint256 originChainId, uint256 destinationChainId, uint64 relayerFeePct,uint32 indexed depositId, uint32 quoteTimestamp,address indexed originToken, address recipient,address indexed depositor)";

export const FUNC_ABI = [
  "function name() external view returns(string)",
  "function decimals() external view returns(uint8)",
];
