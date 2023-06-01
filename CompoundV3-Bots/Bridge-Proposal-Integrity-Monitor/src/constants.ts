export const PROPOSAL_EVENT_ABI =
  "event ProposalCreated(address indexed rootMessageSender, uint id, address[] targets, uint[] values, string[] signatures, bytes[] calldatas, uint eta)";

export const SEND_MESSAGE_ABI = "function sendMessageToChild(address _receiver, bytes calldata _data) public";

export const EXECUTE_TX_ABI =
  "event ExecuteTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta)";

export const FX_CHILD_ABI = "function fxChild() public view returns (address)";

export const TIMELOCK_ABI = "function govTimelock() public view returns (address)";

export const FX_ROOT_ABI = "function fxRoot() public view returns (address)";
