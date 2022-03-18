import { BigNumber } from "ethers";

export const QI_ADDRESS = "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5".toLowerCase();

export const DELEGATE_VOTES_CHANGED_ABI =
  "event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance)";

export const PERCENTAGE_THRESHOLD = BigNumber.from("30");
