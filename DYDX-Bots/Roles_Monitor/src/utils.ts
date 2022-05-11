import { utils } from "ethers";

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

export const MODULE_IFACE: utils.Interface = new utils.Interface(EVENTS);
