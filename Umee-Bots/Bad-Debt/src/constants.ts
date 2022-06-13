export const EVENTS_ABI = [
  "event Deposit(address indexed reserve,address user, address indexed onBehalfOf,uint256 amount,uint16 indexed referral)",
  "event Withdraw(address indexed reserve, address indexed user, address indexed to, uint256 amount)",
  "event Swap(address indexed reserve, address indexed user, uint256 rateMode)",
  "event FlashLoan(address indexed target,address indexed initiator,address indexed asset,uint256 amount, uint256 premium,uint16 referralCode)",
  "event Borrow(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint256 borrowRateMode, uint256 borrowRate, uint16 indexed referral)",
];

export const GET_USER_ACCOUNT_DATA_ABI = [
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralETH,uint256 totalDebtETH,uint256 availableBorrowsETH,uint256 currentLiquidationThreshold,uint256 ltv,uint256 healthFactor)",
];
