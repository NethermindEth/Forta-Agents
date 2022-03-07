# Impossible Finance token non-whitelist mint

## Description

This agent detects IF and IDIA token mints to non-whitelisted addresses, excluding mints through the function `staxMigrate`

## Supported Chains

- Ethereum
- Binance Smart Chain

## Alerts

- IMPOSSIBLE-2-1
  - Fired when the Impossible Finance token mint occurs and the recipient is not a whitelisted address
  - Severity is always set to "high"
  - Type is always set to "suspicious"
  - Finding metadata
    - `receiver`: The non-whitelisted account that received the tokens from the mint

- IMPOSSIBLE-2-2
  - Fired when the Impossible Decentralized Incubator Access token mint occurs and the recipient is not a whitelisted address
  - Severity is always set to "high"
  - Type is always set to "suspicious"
  - Finding metadata
    - `receiver`: The non-whitelisted account that received the tokens from the mint

## Test Data

The agent behaviour can be verified with the following transactions (Ethereum Network):

- `0xe8d2ee70539e9dae26704569d6576ba0f5137908347a42a482fa22e8f88217bf` (IF - Mint to authorized address)
- `0xb44ef8a0fbe33872edee723b90465ccdf1269a24cbc0119bfcf7bb31f8cfb3bb` (IDIA - Mint to authorized address)

Note that there are no existing transactions where a mint to a non-whitelisted address has occurred
To verify behaviour when a mint to a non-whitelisted address occurs run `npm test`
