import { LogDescription, Finding, FindingSeverity, FindingType } from "forta-agent";

// <ChainId, AugustusSwapper contract address>
export const AUGUSTUS_SWAPPER_CONTRACTS: { [key: number]: string } = {
  1: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // Ethereum Mainnet
  137: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // Polygon
  56: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // BSC
  43114: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // Avalanche
  250: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // Fantom
  3: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // Ropsten
};

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
