export const LOCAL_TIMELOCK_ABI = "function localTimelock() public view returns (address)";
export const EXECUTE_TRANSACTION_ABI =
  "event ExecuteTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature,  bytes data, uint eta)";
export const PROPOSAL_EXECUTED_ABI = "event ProposalExecuted(uint indexed id)";
export const PROPOSAL_CREATED_ABI =
  "event ProposalCreated(address indexed rootMessageSender, uint id, address[] targets, uint[] values, string[] signatures, bytes[] calldatas, uint eta)";
