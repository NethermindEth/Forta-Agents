import { Interface } from "@ethersproject/abi";

const CHIEF = [
  "function hat() public view returns (address)",
  "function approvals(address addr) public view returns (uint256)",
];

const CHIEF_IFACE: Interface = new Interface(CHIEF);

export default {
  CHIEF,
  CHIEF_IFACE,
};
