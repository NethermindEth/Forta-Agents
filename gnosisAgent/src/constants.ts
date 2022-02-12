const ADD_PROPOSOAL: string  = "function addProposal(string memory proposalId, bytes32[] memory txHashes)";
const ADD_PROPOSAL_WITH_NONCE: string = "function addProposalWithNonce(string memory proposalId, bytes32[] memory txHashes, uint256 nonce)";
const MARK_PROPOSAL_AS_INVALID:string = "function markProposalAsInvalid(string memory proposalId, bytes32[] memory txHashes)";
const MARK_PROPOSAL_AS_INVALID_BY_HASH:string = "function markProposalAsInvalidByHash(bytes32 questionHash)";
const MARK_PROPOSAL_WITH_EXPIRED_ANSWER_AS_INVALID:string = "function markProposalWithExpiredAnswerAsInvalid(bytes32 questionHash)";
const EXECUTE_PROPOSAL:string = "function executeProposal(string memory proposalId, bytes32[] memory txHashes, address to, uint256 value, bytes memory data, uint8 operation)";
const EXECUTE_PROPOSAL_WITH_INDEX:string = "function executeProposalWithIndex(string memory proposalId, bytes32[] memory txHashes, address to, uint256 value, bytes memory data, uint8 operation, uint256 txIndex)	";
const GNOSIS_ADDRESS:string = "0x1c511d88ba898b4d9cd9113d13b9c360a02fcea1"

export {
	ADD_PROPOSOAL,
	ADD_PROPOSAL_WITH_NONCE,
	MARK_PROPOSAL_AS_INVALID,
	MARK_PROPOSAL_AS_INVALID_BY_HASH,
	MARK_PROPOSAL_WITH_EXPIRED_ANSWER_AS_INVALID,
	EXECUTE_PROPOSAL,
	EXECUTE_PROPOSAL_WITH_INDEX,
	GNOSIS_ADDRESS
}