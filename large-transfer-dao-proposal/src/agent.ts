import {
  Finding,
  HandleTransaction,
  Initialize,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  ethers,
  getEthersProvider
} from "forta-agent";


export const PROPOSAL_CREATED_EVENT = "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] amounts, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)"
const THRESHOLD_PER_CHAIN: Record<number, number> = {
  1: 2,
  56: 15,
  137: 6000,
  10: 2,
  42161: 2,
  43114: 300,
  250: 17000
}

let chainId: number;

export const provideInitialize = (provider: ethers.providers.Provider): Initialize => {
  return async () => {
    chainId = await provider.getNetwork().then(network => network.chainId)
  }
}

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  const proposalCreatedEvents = txEvent.filterLog(
    PROPOSAL_CREATED_EVENT
  );

  proposalCreatedEvents.forEach((proposal) => {
    const {proposalId, proposer, targets, amounts } = proposal.args;

    amounts.forEach((amount: ethers.BigNumber, i: number) => {
      const amountInEth = Number(ethers.utils.formatEther(amount));

      if (amountInEth > THRESHOLD_PER_CHAIN[chainId]) {
        findings.push(
          Finding.fromObject({
            name: "Large Transfer Proposal Created",
            description: `A large transfer of ${amountInEth} ETH has been proposed in DAO ${proposal.address}`,
            alertId: "LARGE-TRANSFER-PROPOSAL",
            severity: FindingSeverity.Medium,
            type: FindingType.Suspicious,
            metadata: {
              dao: proposal.address,
              proposer,
              proposalId: proposalId.toString(),
              receiver: targets[i],
              amount: amountInEth.toString(),
            },
          })
        );
      }
    });
  });

  return findings;
};

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction,
};
