export const BORROW_ABI =
  "event Borrow(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint256 borrowRateMode, uint256 borrowRate, uint16 indexed referral)";
export const LATEST_ANSWER_ABI = "function latestAnswer() external view returns (int256)";
export const AGGREGATE_ABI =
  "function aggregate(tuple(address target, bytes callData)[] memory calls) public returns (uint256 blockNumber, bytes[] memory returnData)";
export const GET_USER_ACCOUNT_DATA_ABI = {
  inputs: [
    {
      internalType: "address",
      name: "user",
      type: "address",
    },
  ],
  name: "getUserAccountData",
  outputs: [
    {
      internalType: "uint256",
      name: "totalCollateralETH",
      type: "uint256",
    },
    {
      internalType: "uint256",
      name: "totalDebtETH",
      type: "uint256",
    },
    {
      internalType: "uint256",
      name: "availableBorrowsETH",
      type: "uint256",
    },
    {
      internalType: "uint256",
      name: "currentLiquidationThreshold",
      type: "uint256",
    },
    {
      internalType: "uint256",
      name: "ltv",
      type: "uint256",
    },
    {
      internalType: "uint256",
      name: "healthFactor",
      type: "uint256",
    },
  ],
  stateMutability: "view",
  type: "function",
};
