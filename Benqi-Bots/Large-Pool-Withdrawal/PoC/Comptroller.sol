pragma solidity 0.5.17;

contract Comptroller {
  address owner;
  address[] markets;

  event MarketListed(address qiToken);

  constructor() public {
    owner = msg.sender;
  }

  function getAllMarkets() public view returns(address[] memory) {
    return markets;
  }

  function addMarket(address _market) external {
    require(msg.sender == owner, "OnlyOwner");
    markets.push(_market);
    emit MarketListed(_market);
  }
}
