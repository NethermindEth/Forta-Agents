import { Finding, FindingSeverity, FindingType, Network } from "forta-agent";

export function createTransferFinding(
  chainId: number,
  comet: string,
  sender: string,
  amount: number | string
): Finding {
  return Finding.from({
    name: "Base token transfer on Comet contract",
    description:
      "A base token transfer was directed to a Comet contract, without a matching Supply, BuyCollateral event",
    alertId: "COMP2-3",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      cometContract: comet,
      sender,
      transferAmount: amount.toString(),
    },
  });
}
