# Large deposits withdrawals on perpetual exchange

## Description

This bot detects deposits and withdrawals on dYdX perpetual exchange contract with large transfered amounts.

## Supported Chains

- Ethereum

## Alerts

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

> To generate the alerts, the threshold on `agent.ts` Line 14 should changed to 100.000 tokens.

- 0x30c630fe50e492eeff514cab7590921ab21c4fc224cfff7bad0f82ee2a47db0f (LogWithdrawalPerformed - amount > 500000 tokens)
- 0x77387abbc97753343fda4008b543ef01d8ccd987b887d20c047b748e3894e8cb ( LogDeposit - amount > 100000 tokens )
