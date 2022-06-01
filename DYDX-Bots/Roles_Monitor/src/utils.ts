import { Interface } from "ethers/lib/utils";
import { keccak256 } from "forta-agent";

const ROLE_ADMIN_CHANGED_EVENT: string = `event RoleAdminChanged(
    bytes32 indexed role,
    bytes32 indexed previousAdminRole,
    bytes32 indexed newAdminRole
  )`;
const ROLE_GRANTED_EVENT: string =
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)";
const ROLE_REVOKED_EVENT: string =
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)";

export const EVENTS: string[] = [ROLE_ADMIN_CHANGED_EVENT, ROLE_GRANTED_EVENT, ROLE_REVOKED_EVENT];

export const MODULE_IFACE: Interface = new Interface(EVENTS);

// Included "0x00...": "NO_ROLE" for legibility in the findings,
// since it is not used by dYdX like the other roles.
export const ROLES_MAP: Record<string, string> = {
  [keccak256("OWNER_ROLE")]: "OWNER_ROLE",
  [keccak256("EPOCH_PARAMETERS_ROLE")]: "EPOCH_PARAMETERS_ROLE",
  [keccak256("REWARDS_RATE_ROLE")]: "REWARDS_RATE_ROLE",
  [keccak256("BORROWER_ADMIN_ROLE")]: "BORROWER_ADMIN_ROLE",
  [keccak256("CLAIM_OPERATOR_ROLE")]: "CLAIM_OPERATOR_ROLE",
  [keccak256("STAKE_OPERATOR_ROLE")]: "STAKE_OPERATOR_ROLE",
  [keccak256("DEBT_OPERATOR_ROLE")]: "DEBT_OPERATOR_ROLE",
  [keccak256("SLASHER_ROLE")]: "SLASHER_ROLE",
  "0x0000000000000000000000000000000000000000000000000000000000000000": "NO_ROLE",
};
