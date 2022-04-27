import { Interface } from "@ethersproject/abi";
import { utils } from "ethers";

export const PROXY_ADDRESS: string = "0x5Aa653A076c1dbB47cec8C1B4d152444CAD91941";

export const GET_TOTAL_BORROWER_DEBT_BALANCE_ABI: string = "function getTotalBorrowerDebtBalance() external view returns (uint256)";
export const GET_TOTAL_ACTIVE_BALANCE_CURRENT_EPOCH_ABI: string = "function getTotalActiveBalanceCurrentEpoch() public view returns (uint256)";
export const IMPLEMENTATION_IFACE: utils.Interface = new Interface([GET_TOTAL_BORROWER_DEBT_BALANCE_ABI,  GET_TOTAL_ACTIVE_BALANCE_CURRENT_EPOCH_ABI]);