import { Interface } from "ethers/lib/utils";

export const MARKET_UPDATE_ABIS = ["event MarketListed(address jToken)", "event MarketDelisted(address jToken)"];

export const MARKETS_IFACE = new Interface(["function getAllMarkets() public view returns (address[] memory)"]);

export const FUNCTIONS_ABIS = [
  // se staking
  "function deposit(uint256 _amount) external", // transfer in
  "function withdraw(uint256 _amount) external", // transfer out
  "function emergencyWithdraw() external", // transfer out
  // master chef joe v2
  "function deposit(uint256 _pid, uint256 _amount) public", // in
  "function withdraw(uint256 _pid, uint256 _amount) public", // out
  "function emergencyWithdraw(uint256 _pid) public", // out
  // MoneyMaker
  "function convertMultiple(address[] calldata token0, address[] calldata token1, uint256 slippage) external",
  "function convert(address token0, address token1, uint256 slippage) external",
  // jToken markets
  "function transfer(address dst, uint256 amount) external returns (bool)",
  "function transferFrom(address src, address dst, uint256 amount) external returns (bool)",
  "function seize(address liquidator, address borrower, uint256 seizeTokens) external returns (uint256)", // out : Transfers collateral tokens (this market) to the liquidator.
  "function _addReserves(uint256 addAmount) external returns (uint256)", // in: The sender adds to reserves.
  "function _addReservesNative() external payable returns (uint256)",
  "function _reduceReserves(uint256 reduceAmount) external returns (uint256)", // out:  Reduces reserves by transferring to ADMIN!
  "function mint(uint256 mintAmount) external returns (uint256)", // Sender supplies assets into the market and receives jTokens in exchange
  "function mintNative() external payable returns (uint256)", // Sender supplies assets into the market and receives jTokens in exchange
  "function redeem(uint256 redeemTokens) external returns (uint256)", // Sender redeems jTokens in exchange for the underlying asset
  "function redeemNative(uint256 redeemTokens) external returns (uint256)",
  "function redeemUnderlying(uint256 redeemAmount) external returns (uint256)",
  "function redeemUnderlyingNative(uint256 redeemAmount) external returns (uint256)",
  "function borrow(uint256 borrowAmount) external returns (uint256)", // out Sender borrows assets from the protocol to their own address
  "function borrowNative(uint256 borrowAmount) external returns (uint256)",
  "function repayBorrow(uint256 repayAmount) external returns (uint256)", // in Sender repays their own borrow
  "function repayBorrowNative() external payable returns (uint256)",
  "function repayBorrowBehalf(address borrower, uint256 repayAmount) external returns (uint256)",
  "function repayBorrowBehalfNative(address borrower) external payable returns (uint256)",
  "function liquidateBorrow(address borrower, uint256 repayAmount, JTokenInterface jTokenCollateral) external returns (uint256)", // out: The sender liquidates the borrowers collateral. The collateral seized is transferred to the liquidator.
  "function liquidateBorrowNative(address borrower, JTokenInterface jTokenCollateral) external payable returns (uint256)",
  "function flashLoan(ERC3156FlashBorrowerInterface receiver, address initiator, uint256 amount, bytes calldata data) external returns (bool)",
];
