import {
  Finding,
  HandleTransaction,
  Initialize,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  ethers,
  getEthersProvider,
} from "forta-agent";

export const PROPOSAL_CREATED_EVENT =
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] amounts, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)";

// chain ID => threshold, native token symbol
const CONFIG_PER_CHAIN: Record<number, [number, string]> = {
  1: [2, "ETH"],
  56: [15, "BNB"],
  137: [6000, "MATIC"],
  10: [2, "ETH"],
  42161: [2, "ETH"],
  43114: [300, "AVAX"],
  250: [17000, "FTM"],
};

let chainId: number;

export const provideInitialize = (
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    chainId = await provider.getNetwork().then((network) => network.chainId);
  };
};

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  const proposalCreatedEvents = txEvent.filterLog(PROPOSAL_CREATED_EVENT);

  proposalCreatedEvents.forEach((proposal) => {
    const { proposalId, proposer, targets, amounts } = proposal.args;

    amounts.forEach((amount: ethers.BigNumber, i: number) => {
      const amountInEth = Number(ethers.utils.formatEther(amount));

      if (amountInEth > CONFIG_PER_CHAIN[chainId][0]) {
        findings.push(
          Finding.fromObject({
            name: "Large Transfer Proposal Created",
            description: `A large transfer of ${amountInEth} ${CONFIG_PER_CHAIN[chainId][1]} has been proposed in DAO ${proposal.address}`,
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
