import { ethers, Finding, FindingSeverity, FindingType, LogDescription, Network } from "forta-agent";

export function createPauseActionFinding(log: LogDescription, chainId: number): Finding {
  return Finding.from({
    name: "Pause action on Comet contract",
    description: "A pause action was executed in a Comet contract",
    alertId: "COMP2-2-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.High,
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
    alertId: "COMP2-2-2",
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

export function createApproveThisFinding(
  timelock: string,
  comet: string,
  token: string,
  spender: string,
  amount: ethers.BigNumberish,
  chainId: number
): Finding {
  return Finding.from({
    name: "Token approval from Comet contract",
    description: "A token approval was emitted from a Comet contract",
    alertId: "COMP2-2-3",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.High,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      timelock: ethers.utils.getAddress(timelock),
      comet: ethers.utils.getAddress(comet),
      token: ethers.utils.getAddress(token),
      spender: ethers.utils.getAddress(spender),
      amount: amount.toString(),
    },
    addresses: [
      ethers.utils.getAddress(token),
      ethers.utils.getAddress(comet),
      ethers.utils.getAddress(timelock),
      ethers.utils.getAddress(spender),
    ],
  });
}
