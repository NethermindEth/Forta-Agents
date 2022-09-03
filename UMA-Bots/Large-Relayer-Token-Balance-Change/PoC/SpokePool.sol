//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDT is ERC20{

    address monitoredAddress = 0x1Abf3a6C41035C1d2A3c74ec22405B54450f5e13;

    constructor() ERC20("Tether USD", "USDT"){
        _mint(monitoredAddress, 1000000);
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}