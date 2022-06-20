import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function createFinding(recipient: string, amount: string): Finding {
  return Finding.fromObject({
    name: "Large QI Grant",
    description: "There was a large QI Grant in the BENQI Comptroller contract",
    alertId: "BENQI-4",
    protocol: "Benqi Finance",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      recipient,
      amount: amount.toString(),
    },
  });
}
