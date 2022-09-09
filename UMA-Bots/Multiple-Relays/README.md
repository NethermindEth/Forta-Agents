# Multiple Filled Relays detection bot

## Description

This bot detects multiple relays (`FilledRelay` event emissions) in quick succession from the same wallet address on the SpokePool contract.

## Supported Chains

- Ethereum
- Arbitrum
- Polygon
- Optimism

## Alerts
The alert parameters `threshold` and `timeWindow` can be configured in `findings.ts` file.
- UMA-8
  - Triggered when a relayer emits `FilledRelay` event the number of times set by `threshold` in the set `timeWindow`.
  - Severity is always set to "Info".
  - Type is always set to "Suspicious".
  - Metadata contains:
  - `amount`: amount of tokens deposited
  - `originChainId`: token origin chain Id
  - `destinationChainId`: token destination chain Id
  - `tokenName`: token name
  - `depositor`: depositor address
  - `recipient`: recipient address
  - `relayer`: relayer address

## Test Data

### Goerli Testnet
The bot behaviour can be verified with the following transactions on Goerli testnet (PoC contract address is:[0xf80FA9f39075535c60b648A11f272f835Cc7ffDf](https://goerli.etherscan.io/address/0xf80FA9f39075535c60b648A11f272f835Cc7ffDf)):

- [0x0aa1f1afada437efdf170f0a8617a990e566f42d71c444836e9b765fb285188a]
(https://goerli.etherscan.io/tx/0x0aa1f1afada437efdf170f0a8617a990e566f42d71c444836e9b765fb285188a): (expect 2 findings)

- [0x884c87cd76dc7fe8ab9fc426280d68b0c6ad4388d45814c5d7dbf801b4b37592]
(https://goerli.etherscan.io/tx/0x884c87cd76dc7fe8ab9fc426280d68b0c6ad4388d45814c5d7dbf801b4b37592): (expect 1 finding)

- Run the block range [7505553-7505564]
  - [0x2d31a3da06657f449288af498db18274d57df9ce7c208fb6f045d3932e16408e]
(https://goerli.etherscan.io/tx/0x2d31a3da06657f449288af498db18274d57df9ce7c208fb6f045d3932e16408e)

  - [0xf59d033337ccd476a495112eb9a95d5a659b1b7e2ebf916d3dbd3a7379754d60]
(https://goerli.etherscan.io/tx/0xf59d033337ccd476a495112eb9a95d5a659b1b7e2ebf916d3dbd3a7379754d60)

  - [0x1597457d09db4ffad6c94f620ee61169fec23caf145b0e6eca49398dc8365d82]
(https://goerli.etherscan.io/tx/0x1597457d09db4ffad6c94f620ee61169fec23caf145b0e6eca49398dc8365d82)
: (expect 1 finding)
