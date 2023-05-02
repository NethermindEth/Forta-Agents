import { ethers, Finding, FindingSeverity, FindingType, LogDescription, Network } from "forta-agent";

export function createPauseActionFinding(log: LogDescription, chainId: number): Finding {
  return Finding.from({
    name: "Pause action on Comet contract",
    description: "A pause action was executed in a Comet contract",
    alertId: "COMP-2-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      comet: ethers.utils.getAddress(log.address),
      supplyPaused: log.args.supplyPaused.toString(),
      transferPaused: log.args.transferPaused.toString(),
      withdrawPaused: log.args.withdrawPaused.toString(),
      absorbPaused: log.args.absorbPaused.toString(),
      buyPaused: log.args.buyPaused.toString(),
    },
    addresses: [ethers.utils.getAddress(log.address)],
  });
}

export function createWithdrawReservesFinding(log: LogDescription, chainId: number): Finding {
  return Finding.from({
    name: "Withdraw reserves action on Comet contract",
    description: "A withdraw reserves action was executed in a Comet contract",
    alertId: "COMP-2-2",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.High,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      comet: ethers.utils.getAddress(log.address),
      to: ethers.utils.getAddress(log.args.to),
      amount: log.args.amount.toString(),
    },
    addresses: [ethers.utils.getAddress(log.address), ethers.utils.getAddress(log.args.to)],
  });
}

export function createApproveFinding(log: LogDescription, chainId: number): Finding {
  return Finding.from({
    name: "Token approval from Comet contract",
    description: "A token approval was emitted from a Comet contract",
    alertId: "COMP-2-3",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.High,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      comet: ethers.utils.getAddress(log.args.owner),
      token: ethers.utils.getAddress(log.address),
      spender: ethers.utils.getAddress(log.args.spender),
      amount: log.args.amount.toString(),
    },
    addresses: [
      ethers.utils.getAddress(log.address),
      ethers.utils.getAddress(log.args.owner),
      ethers.utils.getAddress(log.args.spender),
    ],
  });
}
