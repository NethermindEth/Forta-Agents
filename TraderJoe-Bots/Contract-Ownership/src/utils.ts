import { Interface } from "ethers/lib/utils";

export const OWNERSHIP_TRANSFERRED_ABI: string =
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)";

export const MONITORED_CONTRACT_IFACE: Interface = new Interface([OWNERSHIP_TRANSFERRED_ABI]);
