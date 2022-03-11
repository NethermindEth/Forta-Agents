import { LogDescription, Finding, FindingSeverity, FindingType } from "forta-agent";

export const CONTRACT = "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57"; //AugustusSwapper contract
export const EVENTS_SIGNATURES = [
  "event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
];

export const createFinding = (log: LogDescription) => {
  let metadata;

  if (log.name == "RoleAdminChanged") {
    metadata = {
      role: log.args.role,
      previousAdminRole: log.args.previousAdminRole,
      newAdminRole: log.args.newAdminRole,
    };
  } else {
    metadata = {
      role: log.args.role,
      account: log.args.account,
      sender: log.args.sender,
    };
  }
  return Finding.fromObject({
    name: `Role Change detected on AccessControl contract`,
    description: `${log.name} event emitted`,
    alertId: "PARASWAP-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Paraswap",
    metadata,
  });
};
