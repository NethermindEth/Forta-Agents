# Impossible Finance token non-whitelist mint

## Description

This agent detects Impossible Finance token mints to non-whitelisted addresses

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

## Test Data

The agent behaviour can be verified with the following transactions:

- 0xe8d2ee70539e9dae26704569d6576ba0f5137908347a42a482fa22e8f88217bf (Ethereum Network) (Mint to authorized address)

Note that there are no existing transactions where a mint to a non-whitelisted address has occurred
To verify behaviour when a mint to a non-whitelisted address occurs run `npm test`
