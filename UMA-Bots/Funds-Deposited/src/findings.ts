import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function createFinding(_metadata: {
  amount: string;
  originChainId: string;
  destinationChainId: string;
  tokenName: string;
  depositor: string;
  recipient: string;
}) {
  return Finding.fromObject({
    name: "SpokePool Funds Deposited Event Emitted",
    description: `Deposited ${_metadata.amount} ${_metadata.tokenName}`,
    alertId: "UMA-1",
    protocol: "UMA",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: _metadata,
  });
}
