import keccak256 from 'keccak256'

export const COMPOUND_GOVERNANCE_ADDRESS =
  '0xc0dA01a04C3f3E0be433606045bB7017A7323E38'

// An event emitted when a new proposal is created
export const PROPOSAL_CREATE_SIGNATURE =
  'ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)'

// An event emitted when a vote has been cast on a proposal
export const PROPOSAL_VOTE_CAST_SIGNATURE =
  'VoteCast(address,uint256,bool,uint256)'

// An event emitted when a proposal has been canceled
export const PROPOSAL_CANCEL_SIGNATURE = 'ProposalCanceled(uint)'

// An event emitted when a proposal has been queued
export const PROPOSAL_QUEUED_SIGNATURE = 'ProposalQueued(uint256,uint256)'

// An event emitted when a proposal has been executed
export const PROPOSAL_EXECUTED_SIGNATURE = 'ProposalExecuted(uint256)'

export const generateHash = (signature: string): string => {
  const hash = keccak256(signature).toString('hex')
  return '0x' + hash
}

export const HashedSigs = [
  { CREATE: generateHash(PROPOSAL_CREATE_SIGNATURE) },
  { VOTE: generateHash(PROPOSAL_VOTE_CAST_SIGNATURE) },
  { QUEUE: generateHash(PROPOSAL_QUEUED_SIGNATURE) },
  { EXECUTE: generateHash(PROPOSAL_EXECUTED_SIGNATURE) },
  { CANCEL: generateHash(PROPOSAL_CANCEL_SIGNATURE) },
]

export enum TOPICS {
  CREATE = 'CREATE',
  VOTE = 'VOTE',
  QUEUE = 'QUEUE',
  EXECUTE = 'EXECUTE',
  CANCEL = 'CANCEL',
}
