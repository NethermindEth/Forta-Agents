import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function createFinding(
  _metadata: {
    amount: string;
    originChainId: string;
    destinationChainId: string;
    tokenName: string;
    depositor: string;
    recipient: string;
    relayer: string;
  },
  isSlowRelay: boolean
) {
  return Finding.fromObject({
    name: "SpokePool Filled Relay Event Emitted",
    description: `${isSlowRelay ? "Slow" : "Fast"} Relay of ${_metadata.amount} ${_metadata.tokenName}`,
    alertId: `${isSlowRelay ? "UMA2-2" : "UMA-2-1"}`,
    protocol: "UMA",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: _metadata,
  });
}
