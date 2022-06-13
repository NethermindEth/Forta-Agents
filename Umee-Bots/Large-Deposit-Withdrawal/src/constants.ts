import { Interface } from "ethers/lib/utils";

export const LATEST_ANSWER_ABI = "function latestAnswer() public view returns (int256)";

export const DEPOSIT_ABI =
  "event Deposit(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referral)";

export const WITHDRAW_ABI =
  "event Withdraw(address indexed reserve, address indexed user, address indexed to, uint256 amount)";

export const ASSET_PRICE_ABI = "function getAssetPrice(address asset) external view returns (uint256)";

export const ASSET_PRICE_IFACE = new Interface([
  "function getAssetPrice(address asset) external view returns (uint256)",
]);

export const LATEST_ANSWER_IFACE = new Interface(["function latestAnswer() external view returns (int256)"]);
