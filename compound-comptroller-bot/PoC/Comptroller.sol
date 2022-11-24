// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

contract Comptroller {
    /// @notice Emitted when pause guardian is changed
    event NewPauseGuardian(address oldPauseGuardian, address newPauseGuardian);

    /// @notice Emitted when an action is paused globally
    event ActionPaused(string action, bool pauseState);

    /// @notice Emitted when an action is paused on a market
    event ActionPaused(CToken cToken, string action, bool pauseState);

    address private owner;
    address oldPauseGuardian;
    address pauseGuardian;

    constructor() {
        owner = msg.sender;
    }

    function setPauseGuardian(address newPauseGuardian) public isOwner {
        pauseGuardian = newPauseGuardian;
        emit NewPauseGuardian(oldPauseGuardian, pauseGuardian);
    }

    function setMintPaused(CToken cToken, bool state) public isOwner {
        emit ActionPaused(cToken, "Mint", state);
    }

    function setTransferPaused(bool state) public isOwner {
        emit ActionPaused("Transfer", state);
    }

    modifier isOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }
}

contract CToken {
    string name;
    string symbol;
    uint8 decimals = 18;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
}
