import { Finding, FindingType, FindingSeverity } from "forta-agent";

export const createFinding = (multiPathAddress: string) => {
  return Finding.fromObject({
    name: "MultiPath DelegateCall",
    description: "A delegated call has been made to the MultiPath contract",
    alertId: "PARASWAP-3",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Paraswap",
    metadata: {
      multiPathAddress
    }
  });
}
