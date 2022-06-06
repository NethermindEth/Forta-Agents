import { Interface } from "ethers/lib/utils";

export const MARKET_UPDATE_ABIS = ["event MarketListed(address jToken)", "event MarketDelisted(address jToken)"];

export const MARKETS_IFACE = new Interface(["function getAllMarkets() public view returns (address[] memory)"]);

export const FUNCTIONS_MAP: Map<string, string> = new Map([
  ["0xb6b55f25", "function deposit(uint256 _amount) external"],
  ["0x2e1a7d4d", "function withdraw(uint256 _amount) external"],
  ["0xdb2e21bc", "function emergencyWithdraw() external"],
  ["0xe2bbb158", "function deposit(uint256 _pid, uint256 _amount) public"],
  ["0x441a3e70", "function withdraw(uint256 _pid, uint256 _amount) public"],
  ["0x5312ea8e", "function emergencyWithdraw(uint256 _pid) public"],
  [
    "0x3feb270e",
    "function convertMultiple(address[] calldata token0, address[] calldata token1, uint256 slippage) external",
  ],
  ["0x248391ff", "function convert(address token0, address token1, uint256 slippage) external"],
  ["0xa9059cbb", "function transfer(address dst, uint256 amount) external returns (bool)"],
  ["0x23b872dd", "function transferFrom(address src, address dst, uint256 amount) external returns (bool)"],
  [
    "0xb2a02ff1",
    "function seize(address liquidator, address borrower, uint256 seizeTokens) external returns (uint256)",
  ],
  ["0x3e941010", "function _addReserves(uint256 addAmount) external returns (uint256)"],
  ["0xd3c57151", "function _addReservesNative() external payable returns (uint256)"],
  ["0x601a0bf1", "function _reduceReserves(uint256 reduceAmount) external returns (uint256)"],
  ["0xa0712d68", "function mint(uint256 mintAmount) external returns (uint256)"],
  ["0x219f2fe7", "function mintNative() external payable returns (uint256)"],
  ["0xdb006a75", "function redeem(uint256 redeemTokens) external returns (uint256)"],
  ["0x4bf03edf", "function redeemNative(uint256 redeemTokens) external returns (uint256)"],
  ["0x852a12e3", "function redeemUnderlying(uint256 redeemAmount) external returns (uint256)"],
  ["0xdff76484", "function redeemUnderlyingNative(uint256 redeemAmount) external returns (uint256)"],
  ["0xc5ebeaec", "function borrow(uint256 borrowAmount) external returns (uint256)"],
  ["0x884b9343", "function borrowNative(uint256 borrowAmount) external returns (uint256)"],
  ["0x0e752702", "function repayBorrow(uint256 repayAmount) external returns (uint256)"],
  ["0x8d3f9c62", "function repayBorrowNative() external payable returns (uint256)"],
  ["0x2608f818", "function repayBorrowBehalf(address borrower, uint256 repayAmount) external returns (uint256)"],
  ["0xdbf76929", "function repayBorrowBehalfNative(address borrower) external payable returns (uint256)"],
  [
    "0xf5e3c462",
    "function liquidateBorrow(address borrower, uint256 repayAmount, address jTokenCollateral) external returns (uint256)",
  ],
  [
    "0x291727a4",
    "function liquidateBorrowNative(address borrower, address jTokenCollateral) external payable returns (uint256)",
  ],
  [
    "0x5cffe9de",
    "function flashLoan(address receiver, address initiator, uint256 amount, bytes calldata data) external returns (bool)",
  ],
]);

export const FUNCTIONS_IFACE = new Interface(Array.from(FUNCTIONS_MAP.values()));
