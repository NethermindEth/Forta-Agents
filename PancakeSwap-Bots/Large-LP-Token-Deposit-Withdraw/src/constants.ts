export const MASTERCHEF_ADDRESS = "0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652"; // (note this is the Masterchef v2 contract)
export const MASTERCHEF_ABI = [
  "event Deposit(address indexed user, uint256 indexed pid, uint256 amount)",
  "event Withdraw(address indexed user, uint256 indexed pid, uint256 amount)",
  "event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount)",
  "function lpToken(uint256 input) public view returns (address token)",
];
export const IBEP20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function name() external view returns (string memory)",
];
