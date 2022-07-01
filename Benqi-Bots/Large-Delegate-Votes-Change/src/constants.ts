import { BigNumber } from "ethers";

export const QI_ADDRESS = "0x8729438eb15e2c8b576fcc6aecda6a148776c0f5";

export const DELEGATE_VOTES_CHANGED_ABI =
  "event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance)";

export const PERCENTAGE_THRESHOLD = BigNumber.from("30"); // 30%
