import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function createFinding(
  comet: string,
  reserves: number | string,
  targetReserves: number | string
): Finding {
  return Finding.from({
    name: `Comet reserves reached targetReserves`,
    description: `Reserves on comet contract are >= target reserves`,
    alertId: "COMP2-1",
    protocol: "Compound",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      comet: comet,
      reserves: reserves.toString(),
      targetReserves: targetReserves.toString(),
    },
  });
}
