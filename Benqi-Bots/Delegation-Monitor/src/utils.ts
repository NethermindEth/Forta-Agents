const DELEGATE_CHANGED_EVENT = `event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)`;
const BALANCE_OF_FUNCTION = ["function balanceOf(address account) external view returns (uint)"];
const TEST_QI_CONTRACT: string = "0xf5841E5df027ed086A749Ecc33BFE7e0Df02B06F";
export default {
  DELEGATE_CHANGED_EVENT,
  BALANCE_OF_FUNCTION,
  TEST_QI_CONTRACT,
};
