// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestPair {
    event FlashSwap(
        address indexed sender,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );

    event RegularSwap(
        address indexed sender,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );

    // Since we are listening for function calls,
    // created a mock `swap` function with the same arguments.
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external {
        // This is the condition in the original `swap` function that
        // determines whether it is a flash swap or not.
        if (data.length > 0) {
            emit FlashSwap(msg.sender, amount0Out, amount1Out, to);
        } else {
            emit RegularSwap(msg.sender, amount0Out, amount1Out, to);
        }
    }
}