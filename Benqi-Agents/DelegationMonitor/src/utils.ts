const DELEGATE_CHANGED_EVENT=`  event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)`;
const BALANCE_OF_FUNCTION=["function balanceOf(address account) external view returns (uint)"]

export default{
    DELEGATE_CHANGED_EVENT,
    BALANCE_OF_FUNCTION
}