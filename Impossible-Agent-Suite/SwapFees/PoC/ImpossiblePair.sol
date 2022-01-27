/// SPDX-License-Identifier: GPL-3
pragma solidity = 0.7.6;

contract ImpossiblePair {
    event UpdatedTradeFees(uint256 _oldFee, uint256 _newFee);
    event UpdatedWithdrawalFeeRatio(uint256 _oldWithdrawalFee, uint256 _newWithdrawalFee);
    // needed for other agent
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    
    function updateTradeFees(uint8 _newFee) external {
        emit UpdatedTradeFees(_newFee - 1, _newFee);
    }

    function updateWithdrawalFeeRatio(uint256 _newFeeRatio) external {
        emit UpdatedWithdrawalFeeRatio(_newFeeRatio - 1, _newFeeRatio);
    }

    // needed for other agent
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external {
        emit Swap(msg.sender, amount0Out + 1, amount1Out + 2, amount0Out, amount1Out, to);
    }
}
