// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

contract MockLendingPool {
    /**
     * @dev Emitted on deposit()
     * @param reserve The address of the underlying asset of the reserve
     * @param user The address initiating the deposit
     * @param onBehalfOf The beneficiary of the deposit, receiving the uTokens
     * @param amount The amount deposited
     * @param referral The referral code used
     **/
    event Deposit(
        address indexed reserve,
        address user,
        address indexed onBehalfOf,
        uint256 amount,
        uint16 indexed referral
    );

    /**
     * @dev Emitted on borrow() and flashLoan() when debt needs to be opened
     * @param reserve The address of the underlying asset being borrowed
     * @param user The address of the user initiating the borrow(), receiving the funds on borrow() or just
     * initiator of the transaction on flashLoan()
     * @param onBehalfOf The address that will be getting the debt
     * @param amount The amount borrowed out
     * @param borrowRateMode The rate mode: 1 for Stable, 2 for Variable
     * @param borrowRate The numeric rate at which the user has borrowed
     * @param referral The referral code used
     **/
    event Borrow(
        address indexed reserve,
        address user,
        address indexed onBehalfOf,
        uint256 amount,
        uint256 borrowRateMode,
        uint256 borrowRate,
        uint16 indexed referral
    );

    /**
     * @dev Emitted on flashLoan()
     * @param target The address of the flash loan receiver contract
     * @param initiator The address initiating the flash loan
     * @param asset The address of the asset being flash borrowed
     * @param amount The amount flash borrowed
     * @param premium The fee flash borrowed
     * @param referralCode The referral code used
     **/
    event FlashLoan(
        address indexed target,
        address indexed initiator,
        address indexed asset,
        uint256 amount,
        uint256 premium,
        uint16 referralCode
    );

    function depositAndFlashloan(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode,
        address receiverAddress,
        uint256 premium
    ) external {
        emit Deposit(asset, msg.sender, onBehalfOf, amount, referralCode);
        emit FlashLoan(receiverAddress, msg.sender, asset, amount, premium, referralCode);
    }

    function borrowAndFlashloan(
        address receiverAddress,
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode,
        uint256 premium,
        uint256 interestRateMode,
        uint256 interestRate
    ) external {
        emit Borrow(asset, msg.sender, onBehalfOf, amount, interestRateMode, interestRate, referralCode);
        emit FlashLoan(receiverAddress, msg.sender, asset, amount, premium, referralCode);
    }

    function borrowDepositAndFlashloan(
        address receiverAddress,
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode,
        uint256 premium,
        uint256 interestRateMode,
        uint256 interestRate
    ) external {
        emit Borrow(asset, msg.sender, onBehalfOf, amount, interestRateMode, interestRate, referralCode);
        emit Deposit(asset, msg.sender, onBehalfOf, amount, referralCode);
        emit FlashLoan(receiverAddress, msg.sender, asset, amount, premium, referralCode);
    }
}
