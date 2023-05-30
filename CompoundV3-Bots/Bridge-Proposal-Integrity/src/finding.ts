import { ethers, Finding, FindingSeverity, FindingType, LogDescription, Network } from "forta-agent";

export function createProposalCreatedFinding(log: LogDescription, chainId: number, txHash: string): Finding {
  return Finding.from({
    name: "Proposal created on BridgeReceiver contract",
    description:
      "A ProposalCreated event was emitted on BridgeReceiver contract, the corresponding creation message was found",
    alertId: "COMP2-5-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      network: Network[chainId] || chainId.toString(),
      bridgeReceiver: ethers.utils.getAddress(log.address),
      proposalId: log.args.id.toString(),
      fxChild: ethers.utils.getAddress(log.args.rootMessageSender),
      txHash,
    },
  });
}

export function createSuspiciouscreateProposalCreatedFinding(log: LogDescription, chainId: number): Finding {
  return Finding.from({
    name: "A suspicious proposal was created on BridgeReceiver contract",
    description:
      "A ProposalCreated event was emitted on BridgeReceiver contract, no corresponding creation message was found",
    alertId: "COMP2-5-2",
    protocol: "Compound",
    type: FindingType.Suspicious,
    severity: FindingSeverity.High,
    metadata: {
      network: Network[chainId] || chainId.toString(),
      bridgeReceiver: ethers.utils.getAddress(log.address),
      proposalId: log.args.id.toString(),
      fxChild: ethers.utils.getAddress(log.args.rootMessageSender),
    },
  });
}
