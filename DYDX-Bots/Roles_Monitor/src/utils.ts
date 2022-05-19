import { Interface, keccak256 } from "ethers/lib/utils";

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

// The keys in the Record are the keccak256 hash of
// the role string. e.g. keccak256("OWNER_ROLE")
export const ROLES_MAP: Record<string, string> = {
  "0xb19546dff01e856fb3f010c267a7b1c60363cf8a4664e21cc89c26224620214e": "OWNER_ROLE",
  "0xa69ba352872fe0ee634bc8d48d2a09a61267da1bfb2015e67a11ad05fe21f04b": "EPOCH_PARAMETERS_ROLE",
  "0x74ec845281a5bcabeef9a800a79d30928ff9e6f2dc6f69a233fc39a83cb81ed2": "REWARDS_RATE_ROLE",
  "0x6c2e489c3a95017c97c0bcc47de38933a0bbf2041c9289b8ca34c445b13177af": "BORROWER_ADMIN_ROLE",
  "0x36dc7495d0ae0bc2a620bf292049e4d4e5f800043895b13c08a1977d3a3297f5": "CLAIM_OPERATOR_ROLE",
  "0xa6fbd0d4ef0ac50b4de984ab8f303863596293cce6d67dd6111979bcf56abe74": "STAKE_OPERATOR_ROLE",
  "0x0428e137352b5b1a834770c71b580c01521c0b3f2442928c650692cd1b3f496c": "DEBT_OPERATOR_ROLE",
  "0x12b42e8a160f6064dc959c6f251e3af0750ad213dbecf573b4710d67d6c28e39": "SLASHER_ROLE",
  "0x0000000000000000000000000000000000000000000000000000000000000000": "NO_ROLE",
};
