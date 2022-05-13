# Large deposits withdrawals on perpetual exchange

## Description

This bot detects deposits and withdrawals on dYdX perpetual exchange contract with large transfered amounts.

## Supported Chains

- Ethereum

## Alerts

- DYDX-1-1

- Fired when `LogDeposit` event is emitted on dYdX perpetual contract with a large quantizied amount.
- Severity is always set to "Info"
- Type is always set to "Info"
- Metadata contains:

  - `quantizedAmount`: tokens amount that was deposited.
  - `starkKey`: stark key of the user making the deposit.
  - `token`: the token that was transfered.

- DYDX-1-2

  - Fired when `LogWithdrawalPerformed` event is emitted on dYdX perpetual contract with a large quantizied amount.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata contains:
    - `quantizedAmount`: tokens amount that was withdrawn.
    - `token`: the token that was transfered.
    - `recipient`: ethereum address receiving the tokens.
    - `ownerKey`: stark key of user withdrawing his tokens.

- DYDX-1-3

  - Fired when `LogMintWithdrawalPerformed` event is emitted on dYdX perpetual contract with a large quantizied amount.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata contains:
    - `quantizedAmount`: tokens amount that was withdrawn.
    - `token`: the asset that was transfered.
    - `assetId`: Id of the minted asset.
    - `ownerKey`: stark key of the recipient.

## Test Data

The bot behaviour can be verified with the following transactions:

### Mainnet

- 0x30c630fe50e492eeff514cab7590921ab21c4fc224cfff7bad0f82ee2a47db0f (`LogWithdrawalPerformed`)
- 0x77387abbc97753343fda4008b543ef01d8ccd987b887d20c047b748e3894e8cb ( `LogDeposit`)

### Kovan Testnet

The following test transactions generated through our `PoC` contracts:

> - `Proxy` PoC contract address: `0xffBfe0EcF9ab8FF44a397ab5324A439ea1a617D8`.
> - `StarkPerpetual` PoC contract address: `0x3b4611a1686e373bFE216Ea82881267a917ec0Da`.

- 0x1f3d04e335721c8676d897215c8be20b28e45ed4204c3ab4c9b55bbcf41035de (`LogDeposit`, 1.2M tokens)
- 0x323eb885a4c89c382f6ba37598d3756517ab65dcc579978180e45369c315ed25 (`LogWithdrawalPerformed`, 1.5M tokens)
- 0x0d6b773e16f3e367a65be44ae786ea8ff39e482fe070889889adf2988ea87acd (`LogMintWithdrawalPerformed`, 1.1M tokens)
