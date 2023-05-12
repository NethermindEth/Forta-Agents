import { ethers, Finding, FindingSeverity, FindingType, Network } from "forta-agent";

export function createSuccessfulProposalExecutionFinding(
  bridgeReceiver: string,
  timelock: string,
  proposalId: ethers.BigNumber,
  chainId: number
): Finding {
  return Finding.from({
    name: "Successful proposal execution on bridge receiver",
    description: "A bridge receiver proposal was fully executed",
    alertId: "COMP2-6-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      bridgeReceiver: ethers.utils.getAddress(bridgeReceiver),
      timelock: ethers.utils.getAddress(timelock),
      proposalId: proposalId.toString(),
    },
    addresses: [ethers.utils.getAddress(bridgeReceiver), ethers.utils.getAddress(timelock)],
  });
}

export function createUnsuccessfulProposalExecutionFinding(
  bridgeReceiver: string,
  timelock: string,
  proposalId: ethers.BigNumber,
  chainId: number
): Finding {
  return Finding.from({
    name: "Unsuccessful proposal execution on bridge receiver",
    description: "A bridge receiver proposal was not fully executed",
    alertId: "COMP2-6-2",
    protocol: "Compound",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Unknown,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      bridgeReceiver: ethers.utils.getAddress(bridgeReceiver),
      timelock: ethers.utils.getAddress(timelock),
      proposalId: proposalId.toString(),
    },
    addresses: [ethers.utils.getAddress(bridgeReceiver), ethers.utils.getAddress(timelock)],
  });
}

export function createUnknownTimelockExecutionFinding(
  bridgeReceiver: string,
  timelock: string,
  target: string,
  value: ethers.BigNumber,
  signature: string,
  data: string,
  chainId: number
): Finding {
  return Finding.from({
    name: "Unknown transaction was executed through the Timelock contract",
    description: "A transaction that is not linked to any proposal was executed through the Timelock contract",
    alertId: "COMP2-6-3",
    protocol: "Compound",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Unknown,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      bridgeReceiver: ethers.utils.getAddress(bridgeReceiver),
      timelock: ethers.utils.getAddress(timelock),
      target: ethers.utils.getAddress(target),
      value: value.toString(),
      signature,
      data,
    },
    addresses: [
      ethers.utils.getAddress(bridgeReceiver),
      ethers.utils.getAddress(timelock),
      ethers.utils.getAddress(target),
    ],
  });
}
