import { Interface } from "@ethersproject/abi";
import { utils, BigNumber } from "ethers";

export const GET_TOTAL_BORROWER_DEBT_BALANCE_ABI: string =
  "function getTotalBorrowerDebtBalance() external view returns (uint256)";
export const GET_TOTAL_ACTIVE_BALANCE_CURRENT_EPOCH_ABI: string =
  "function getTotalActiveBalanceCurrentEpoch() public view returns (uint256)";
export const IMPLEMENTATION_IFACE: utils.Interface = new Interface([
  GET_TOTAL_BORROWER_DEBT_BALANCE_ABI,
  GET_TOTAL_ACTIVE_BALANCE_CURRENT_EPOCH_ABI,
]);

export const THRESHOLD_AMOUNT: BigNumber = BigNumber.from("0"); // 0
