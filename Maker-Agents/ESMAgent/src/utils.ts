import { utils } from "ethers";

export const CHAINLOG_ADDRESS: string = "0xdA0Ab1e0017DEbCd72Be8599041a2aa3bA7e740F";
const CHAINLOG_ABI: string = "function getAddress(bytes32 _key) public view returns (address addr)";
export const UPDATE_ADDR_ABI: string = "event UpdateAddress(bytes32 key, address addr)";
export const UPDATE_ADDR_SIG: string = "UpdateAddress(bytes32,address)";
export const CHAINLOG_IFACE: utils.Interface = new utils.Interface([CHAINLOG_ABI]);
export const ESM_KEY_BYTES: string = utils.formatBytes32String("MCD_ESM");
