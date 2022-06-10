// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

contract UmeeOracle {
    constructor() public {}

    address public DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address public ATOM = 0x9D44dFF651D817E6cCd79188d0CF7800D7572E14;
    address public WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    uint256 public atomPrice = 0.8 ether;
    uint256 public daiPrice = 0.5 ether;
    uint256 public usdcPrice = 0.5 ether;
    uint256 public wethPrice = 1 ether;
    uint256 public usdtPrice = 0.5 ether;

    function getAssetPrice(address asset) public view returns (uint256) {
        if (asset == WETH) {
            return wethPrice;
        } else if (asset == DAI) {
            return daiPrice;
        } else if (asset == USDC) {
            return usdcPrice;
        } else if (asset == USDT) {
            return usdtPrice;
        } else if (asset == ATOM) {
            return atomPrice;
        } else {
            return 1 ether;
        }
    }

    function setAtomPrice(uint256 _price) public {
        atomPrice = _price;
    }

    function setUsdcPrice(uint256 _price) public {
        usdcPrice = _price;
    }

    function setUsdtPrice(uint256 _price) public {
        usdtPrice = _price;
    }

    function setDaiPrice(uint256 _price) public {
        daiPrice = _price;
    }

    function setWethPrice(uint256 _price) public {
        wethPrice = _price;
    }
}
