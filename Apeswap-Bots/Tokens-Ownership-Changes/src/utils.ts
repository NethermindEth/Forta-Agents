import { Interface } from "@ethersproject/abi";

export const EVENTS_ABI: string[] = [
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)", //BSC
  "event LogChangeMPCOwner(address indexed oldOwner, address indexed newOwner, uint indexed effectiveHeight)", //Polygon
];

export const EVENTS_IFACE: Interface = new Interface(EVENTS_ABI);
