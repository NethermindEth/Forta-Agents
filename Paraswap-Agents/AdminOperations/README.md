# Admin Operations Agent

## Description

This agent detects admin operations on `AugustusSwapper` Contract.

## Supported Chains

- Ethereum
- Polygon
- BSC
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

  - Fired when the tokens were transfers through calls to `transferTokens`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata fields:
    - `token`: Address of the transfered token.
    - `destination`: Address to which the tokens were transfered.
    - `amount`: Amount of transfered tokens.

- PARASWAP-1-3

  - Fired when the router implementation was upgraded through calls to `setImplementation`.
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
