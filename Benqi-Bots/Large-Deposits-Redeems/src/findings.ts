import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (name: string, _pglAmount: number, _user: string) => {
  switch (name) {
    case "deposit":
      return Finding.fromObject({
        name: `Large deposit on PGL staking contract`,
        description: `${name} function was called in PGL staking contract with a large pglAmount`,
        alertId: "BENQI-7-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Benqi Finance",
        metadata: {
          user: _user.toLowerCase(),
          pglAmount: _pglAmount.toString(),
        },
      });

    default:
    case "redeem":
      return Finding.fromObject({
        name: `Large redeem on PGL staking contract`,
        description: `${name} function was called in PGL staking contract with a large pglAmount`,
        alertId: "BENQI-7-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Benqi Finance",
        metadata: {
          user: _user.toLowerCase(),
          pglAmount: _pglAmount.toString(),
        },
      });
  }
};
