import { LogDescription, Finding, FindingSeverity, FindingType } from "forta-agent";

export const SWAPPER_CONTRACT = "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57"; //AugustusSwapper contract
export const EVENTS_ABI = [
  "event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
];

export const createFinding = (log: LogDescription) => {
  if (log.name == "RoleAdminChanged") {
    return Finding.fromObject({
      name: `${log.name} event emitted`,
      description: "Admin role change detected on AugustusSwapper contract",
      alertId: "PARASWAP-2-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Paraswap",
      metadata: {
        role: log.args.role,
        previousAdminRole: log.args.previousAdminRole,
        newAdminRole: log.args.newAdminRole,
      },
    });
  } else if (log.name == "RoleGranted") {
    return Finding.fromObject({
      name: `${log.name} event emitted`,
      description: "Role grant detected on AugustusSwapper contract",
      alertId: "PARASWAP-2-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Paraswap",
      metadata: {
        role: log.args.role,
        account: log.args.account,
        sender: log.args.sender,
      },
    });
  } else {
    return Finding.fromObject({
      name: `${log.name} event emitted`,
      description: "Role revoke detected on AugustusSwapper contract",
      alertId: "PARASWAP-2-3",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Paraswap",
      metadata: {
        role: log.args.role,
        account: log.args.account,
        sender: log.args.sender,
      },
    });
  }
};
