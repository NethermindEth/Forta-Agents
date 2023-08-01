export const PAUSE_ACTION_ABI =
  "event PauseAction(bool supplyPaused, bool transferPaused, bool withdrawPaused, bool absorbPaused, bool buyPaused)";
export const WITHDRAW_RESERVES_ABI = "event WithdrawReserves(address indexed to, uint amount)";
export const EXECUTE_TRANSACTION_ABI =
  "event ExecuteTransaction(bytes32 indexed txHash, address indexed target, uint256 value, string signature, bytes data, uint256 eta)";
export const APPROVE_THIS_ABI = "function approveThis(address manager, address asset, uint256 amount)";
