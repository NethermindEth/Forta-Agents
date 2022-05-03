pragma solidity 0.5.17;

contract QiToken {
  address owner;

  uint256 public totalSupply;

  constructor() public {
    owner = msg.sender;
  }

  event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens);

  function redeem(address _redeemer, uint256 _redeemAmount, uint256 _redeemTokens) public {
    require(owner == msg.sender, "OnlyOwner");
    emit Redeem(_redeemer, _redeemAmount, _redeemTokens);
  }

  function setTotalSupply(uint256 _totalSupply) external {
    require(owner == msg.sender, "OnlyOwner");
    totalSupply = _totalSupply;
  }
}
