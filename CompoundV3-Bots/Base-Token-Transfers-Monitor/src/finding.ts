import { ethers, Finding, FindingSeverity, FindingType, Network } from "forta-agent";

export function createTransferFinding(
  chainId: number,
  comet: string,
  sender: string,
  amount: ethers.BigNumberish
): Finding {
  return Finding.from({
    name: "Direct base token transfer to Comet contract",
    description: "A base token transfer was made to a Comet contract without a matching Supply or BuyCollateral event",
    alertId: "COMP2-3-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      comet: ethers.utils.getAddress(comet),
      sender: ethers.utils.getAddress(sender),
      transferAmount: amount.toString(),
    },
    addresses: [ethers.utils.getAddress(comet), ethers.utils.getAddress(sender)],
  });
}