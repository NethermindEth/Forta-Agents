import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (name: string, args: any, logAddress: string, rolesMap: Record<string, string>) => {
  switch (name) {
    case "RoleAdminChanged":
      return Finding.fromObject({
        name: "Admin role has changed",
        description: `${name} event was emitted`,
        alertId: "DYDX-18-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          role: rolesMap[args.role],
          previousAdminRole: rolesMap[args.previousAdminRole],
          newAdminRole: rolesMap[args.newAdminRole],
        },
        addresses: [logAddress],
      });

    case "RoleGranted":
      return Finding.fromObject({
        name: "Role has been granted",
        description: `${name} event was emitted`,
        alertId: "DYDX-18-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          role: rolesMap[args.role],
          account: args.account.toLowerCase(),
          sender: args.sender.toLowerCase(),
        },
        addresses: [logAddress],
      });

    default:
      return Finding.fromObject({
        name: "Role has been revoked",
        description: `${name} event was emitted`,
        alertId: "DYDX-18-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          role: rolesMap[args.role],
          account: args.account.toLowerCase(),
          sender: args.sender.toLowerCase(),
        },
        addresses: [logAddress],
      });
  }
};
