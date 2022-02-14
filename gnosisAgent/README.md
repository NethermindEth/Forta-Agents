## Gnosis Safe admin changes

### Description

This agent reports transactions that includes execution of any of these function: 
- function addProposal(string memory proposalId, bytes32[] memory txHashes)
- function addProposalWithNonce(string memory proposalId, bytes32[] memory txHashes, uint256 nonce)
- function markProposalAsInvalid(string memory proposalId, bytes32[] memory txHashes)
- function markProposalAsInvalidByHash(bytes32 questionHash)
- function markProposalWithExpiredAnswerAsInvalid(bytes32 questionHash)
- function executeProposal(string memory proposalId, bytes32[] memory txHashes, address to, uint256 value, bytes memory data, uint8 operation)
- function executeProposalWithIndex(string memory proposalId, bytes32[] memory txHashes, address to, uint256 value, bytes memory data, uint8 operation, uint256 txIndex)


### Supported Chains
- Ethereum

### Alerts
Describe each of the type of alerts fired by this agent
- FORTA-8
	- Fired when any of the following functions are called
		- addProposal
		- addProposalWithNonce, 
		- markProposalAsInvalid, 
		- markProposalAsInvalidByHash, 
		- markProposalWithExpiredAnswerAsInvalid, 
		- executeProposal, 
		- executeProposalWithIndex
	- Severity is always set to "Info".
	- Type is always set to "Info".
	- Metadata contains:
		- `by`: the address that executed the transaction
		- All the parameter values that were passed to the executed function.

### Test Data
The agent behaviour can be verified by the following transaction.
0x6cc66d0d3c8ecf0f4e28c508aa9d7d3b28ea5f9daa3d88509a2d0848bd32436e

