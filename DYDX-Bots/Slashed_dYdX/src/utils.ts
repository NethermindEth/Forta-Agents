import { utils } from "ethers";

export const SLASHED_EVENT: string = "event Slashed(uint256 amount, address recipient, uint256 newExchangeRate)";

export const MODULE_IFACE: utils.Interface = new utils.Interface([SLASHED_EVENT]);
