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
  txHash: string,
  target: string,
  value: ethers.BigNumber,
  signature: string,
  data: string,
  eta: ethers.BigNumber,
  chainId: number
): Finding {
  // try decoding the arguments from the calldata, fallback to raw data
  try {
    const iface = new ethers.utils.Interface(["function " + signature]);
    const { args } = iface.parseTransaction({
      data: ethers.utils.hexConcat([iface.getSighash(iface.fragments[0]), data]),
    });

    const stringifyDecodedArgs = (args: any[]): any[] =>
      args.map((arg: any) => {
        if (Array.isArray(arg)) {
          return stringifyDecodedArgs(arg);
        } else {
          return arg.toString();
        }
      });

    data = JSON.stringify(stringifyDecodedArgs(args as any[]));
  } catch {
    // fallback to raw data
  }

  return Finding.from({
    name: "Unknown transaction was executed through the Timelock contract",
    description:
      "A transaction that is not linked to any proposal was executed through the Timelock contract. This might have been due to the proposal creation not being recognized, please check the bot logs.",
    alertId: "COMP2-6-3",
    protocol: "Compound",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Unknown,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      bridgeReceiver: ethers.utils.getAddress(bridgeReceiver),
      timelock: ethers.utils.getAddress(timelock),
      txHash,
      target: ethers.utils.getAddress(target),
      value: value.toString(),
      signature,
      data,
      eta: eta.toString(),
    },
    addresses: [
      ethers.utils.getAddress(bridgeReceiver),
      ethers.utils.getAddress(timelock),
      ethers.utils.getAddress(target),
    ],
  });
}
