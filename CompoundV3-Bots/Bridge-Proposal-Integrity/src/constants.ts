export const PROPOSAL_EVENT_ABI =
  "event ProposalCreated(address indexed rootMessageSender, uint id, address[] targets, uint[] values, string[] signatures, bytes[] calldatas, uint eta)";

export const SEND_MESSAGE_ABI =
  "function sendMessageToChild(address _receiver, bytes calldata _data) public";

export const EXECUTE_TX_ABI =
  "event ExecuteTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature,  bytes data, uint eta)";
