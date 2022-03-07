/// SPDX-License-Identifier: GPL-3
pragma solidity = 0.7.6;

contract ImpossiblePair {
    event UpdatedTradeFees(uint256 _oldFee, uint256 _newFee);
    event UpdatedWithdrawalFeeRatio(uint256 _oldWithdrawalFee, uint256 _newWithdrawalFee);

    bool private initialized = false;
    address public token0;
    address public token1;
    uint8 public fee;
    uint256 public ratio;
    
    function updateTradeFees(uint8 _newFee) external {
        emit UpdatedTradeFees(fee, _newFee);
        fee = _newFee;
    }

    function updateWithdrawalFeeRatio(uint256 _newFeeRatio) external {
        emit UpdatedWithdrawalFeeRatio(ratio, _newFeeRatio);
        ratio = _newFeeRatio;
    }

    function setData(address t0, address t1, uint8 _fee, uint256 _ratio) external {
        require(!initialized, "Contract already initialized");

        token0 = t0;
        token1 = t1;
        fee = _fee;
        ratio = _ratio;
        initialized = true;
    }
}
