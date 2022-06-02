import { Interface } from "ethers/lib/utils";

export const PERCENTAGE = 10; // 10%

export const EVENTS_ABIS = [
  "event Mint(address minter, uint256 mintAmount, uint256 mintTokens)",
  "event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens)",
  "event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)",
];

export const SUPPLY_IFACE = new Interface([
  "function totalSupply() external view returns (uint256)",
]);

export const MARKET_UPDATE_ABIS = [
  "event MarketListed(address jToken)",
  "event MarketDelisted(address jToken)",
];

export const MARKETS_IFACE = new Interface([
  "function getAllMarkets() public view returns (address[] memory)",
]);
