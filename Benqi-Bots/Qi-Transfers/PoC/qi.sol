pragma solidity ^0.8.0;

contract Qi {
    /// @notice EIP-20 token name for this token
    string public constant name = "BENQI";

    /// @notice EIP-20 token symbol for this token
    string public constant symbol = "QI";

    /// @notice EIP-20 token decimals for this token
    uint8 public constant decimals = 18;

    /// @notice Total number of tokens in circulation
    uint256 public constant totalSupply = 7_200_000_000e18; // 7 billion 200 million QI

    /// @notice Official record of token balances for each account
    mapping(address => uint96) internal balances;

    /// @notice The standard EIP-20 transfer event
    event Transfer(address indexed from, address indexed to, uint256 amount);

    /**
     * @notice Construct a new QI token
     * @param account The initial account to grant all the tokens
     */
    constructor(address account) {
        balances[account] = uint96(totalSupply);
        emit Transfer(address(0), account, totalSupply);
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function transfer(address dst, uint256 rawAmount) external returns (bool) {
        uint96 amount = safe96(rawAmount, "Qi::transfer: amount exceeds 96 bits");
        _transferTokens(msg.sender, dst, amount);
        return true;
    }

    /**
     * @notice Transfer `amount` tokens from `src` to `dst`
     * @param src The address of the source account
     * @param dst The address of the destination account
     * @param rawAmount The number of tokens to transfer
     * @return Whether or not the transfer succeeded
     */
    function transferFrom(
        address src,
        address dst,
        uint256 rawAmount
    ) external returns (bool) {
        uint96 amount = safe96(rawAmount, "Qi::approve: amount exceeds 96 bits");

        _transferTokens(src, dst, amount);
        return true;
    }

    function _transferTokens(
        address src,
        address dst,
        uint96 amount
    ) internal {
        require(src != address(0), "Qi::_transferTokens: cannot transfer from the zero address");
        require(dst != address(0), "Qi::_transferTokens: cannot transfer to the zero address");

        balances[src] = sub96(balances[src], amount, "Qi::_transferTokens: transfer amount exceeds balance");
        balances[dst] = add96(balances[dst], amount, "Qi::_transferTokens: transfer amount overflows");
        emit Transfer(src, dst, amount);
    }

    function safe32(uint256 n, string memory errorMessage) internal pure returns (uint32) {
        require(n < 2**32, errorMessage);
        return uint32(n);
    }

    function safe96(uint256 n, string memory errorMessage) internal pure returns (uint96) {
        require(n < 2**96, errorMessage);
        return uint96(n);
    }

    function add96(
        uint96 a,
        uint96 b,
        string memory errorMessage
    ) internal pure returns (uint96) {
        uint96 c = a + b;
        require(c >= a, errorMessage);
        return c;
    }

    function sub96(
        uint96 a,
        uint96 b,
        string memory errorMessage
    ) internal pure returns (uint96) {
        require(b <= a, errorMessage);
        return a - b;
    }
}
