import { Interface } from "@ethersproject/abi";

const CHIEF = [
  "function hat() public view returns (address)",
  "function approvals(address addr) public view returns (uint256)",
];

const CHIEF_IFACE: Interface = new Interface(CHIEF);

const CHAINLOG = ["function getAddress(bytes32 _key) public view returns (address addr)"];

export const EVENT_ABI = ["event UpdateAddress(bytes32 key, address addr)"];

export const CHAINLOG_IFACE: Interface = new Interface(CHAINLOG);

export default {
  CHIEF,
  CHIEF_IFACE,
  CHAINLOG_IFACE,
};
