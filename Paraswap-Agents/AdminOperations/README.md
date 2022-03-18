# Admin Operations Agent

## Description

This agent detects admin operations on `AugustusSwapper` Contract.

## Supported Chains

- Ethereum
- Polygon
- Binance Smart Chain
- Avalanche
- Fantom
- Ropsten

## Alerts

- PARASWAP-1-1

  - Fired when the `Router` or `Adapter` has been initialized.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata fields:
    - `address`: Address of the initialized router/adapter.

- PARASWAP-1-2

  - Fired when tokens, or ETH, are transferred through a call to `transferTokens`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata fields:
    - `token`: Address of the transfered token, `ETH` if it's an ETH transfer.
    - `destination`: Address to which the tokens were transfered.
    - `amount`: Amount of transfered tokens.

- PARASWAP-1-3

  - Fired when a router implementation is set through calls to `setImplementation`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata fields:
    - `selector`: Selector of the new implementation.
    - `implementation`: Address of the new router implementation.

- PARASWAP-1-4

  - Fired when a new partner was registred through calls to `registerPartner`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata fields:
    - `partner`: Address of the new partner.
    - `partnerShare`: The partner share.
    - `noPositiveSlippage`: Set to `true` if positive slippage should not be taken into account. `false` otherwise.
    - `positiveSlippageToUser`: Set to `true` if positive slippage should go to the user. `false` otherwise.
    - `feePercent`: Partner fee Percent.

- PARASWAP-1-5

  - Fired when the Fee Wallet address was changed through calls to `setFeeWallet`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata fields:
    - `new_address`: Address of the new Fee Wallet.

## Test Data

The agent behaviour can be verified with the following transactions (Ropsten):

- 0x6541e757606ca93db8a185c4871c6dded58aba86319585b05a280f7db32f7441 (call to `setImplementation`, finding generated)
