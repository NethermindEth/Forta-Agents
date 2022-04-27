import { Interface } from "@ethersproject/abi";
import { utils } from "ethers";

export const PROXY_ADDRESS: string = "0x5Aa653A076c1dbB47cec8C1B4d152444CAD91941"; // Mainnet proxy address
// Uncomment line below, and comment out line above, to test the bot with the Kovan testnet
// export const PROXY_ADDRESS: string = "0xe9511Faa2B2ccE548A5999b4bC3772e6a0f1C14A"; // Kovan testnet proxy address

export const GET_TOTAL_BORROWER_DEBT_BALANCE_ABI: string =
  "function getTotalBorrowerDebtBalance() external view returns (uint256)";
export const GET_TOTAL_ACTIVE_BALANCE_CURRENT_EPOCH_ABI: string =
  "function getTotalActiveBalanceCurrentEpoch() public view returns (uint256)";
export const IMPLEMENTATION_IFACE: utils.Interface = new Interface([
  GET_TOTAL_BORROWER_DEBT_BALANCE_ABI,
  GET_TOTAL_ACTIVE_BALANCE_CURRENT_EPOCH_ABI,
]);
