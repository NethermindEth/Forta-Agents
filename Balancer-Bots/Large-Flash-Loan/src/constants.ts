export const FLASH_LOAN_ABI =
  "event FlashLoan(address indexed recipient, address indexed token, uint256 amount, uint256 feeAmount)";
export const TOKEN_ABI = [
  "function balanceOf(address account) public view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
];
