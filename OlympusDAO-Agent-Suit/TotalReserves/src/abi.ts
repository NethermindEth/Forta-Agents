import { Interface } from "@ethersproject/abi";

const TREASURY_ABI: string[] = [
    "event ReservesUpdated( uint256 indexed totalReserves )",
    "function totalReserves() external view returns (uint256 reserves)"
];

const TREASURY_IFACE: Interface = new Interface(TREASURY_ABI);

export default {
    TREASURY_ABI,
    TREASURY_IFACE
};
