# Filled Relays detection bot

## Description

This bot detects the following SpokePool events:
- `FilledRelay` event

## Supported Chains

- Ethereum
- Arbitrum
- Polygon
- Optimism

## Alerts
- UMA-2-1
  - Triggered when a `FilledRelay` event is detected and `isSlowRelay` is set to `False`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
  - `amount`: amount of tokens deposited
  - `originChainId`: token origin chain Id
  - `destinationChainId`: token destination chain Id
  - `tokenName`: token name
  - `depositor`: depositor address
  - `recipient`: recipient address
  - `relayer`: relayer address

- UMA-2-2
  - Triggered when a `FilledRelay` event is detected and `isSlowRelay` is set to `True`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
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
The bot behaviour can be verified with the following transactions on Goerli testnet (PoC contract address is:[0xA8FEd6B0CaDc7bcAbD76f9A7399B0A5Ca0C93A22](https://goerli.etherscan.io/address/0xA8FEd6B0CaDc7bcAbD76f9A7399B0A5Ca0C93A22)):

- [0xf0a90616108b277350c57b229f293069275c169cb6e11ec63b2f942080be87ba]
(https://goerli.etherscan.io/tx/0xf0a90616108b277350c57b229f293069275c169cb6e11ec63b2f942080be87ba): (expect 1 finding: 1 `FilledRelay` event)

- [0xdf8eddcff5e3b724577ea0c404e221a9b7ad89403fcde92206b2f3a79a50eaba]
(https://goerli.etherscan.io/tx/0xdf8eddcff5e3b724577ea0c404e221a9b7ad89403fcde92206b2f3a79a50eaba): (expect 2 findings: 2 `FilledRelay` events)

- [0x97ab0e9eedf62c2d76fe591b15fe9e36f865b81751a7aa0864393386fb64b2c6]
(https://goerli.etherscan.io/tx/0x97ab0e9eedf62c2d76fe591b15fe9e36f865b81751a7aa0864393386fb64b2c6): (expect 1 finding: 1 `FilledRelay` event and 0 `SetDepositQuoteTimeBuffer` event)

### Ethereum
The bot behaviour can be verified with the following transactions on Ethereum mainnet ( Contract address is:[0x4D9079Bb4165aeb4084c526a32695dCfd2F77381](https://etherscan.io/address/0x4D9079Bb4165aeb4084c526a32695dCfd2F77381)):

- [0xeffb7de17fe9ba78a4ea11803b4a2fce964261d3ecb800b0cad1935acb51e400]
(https://etherscan.io/tx/0xeffb7de17fe9ba78a4ea11803b4a2fce964261d3ecb800b0cad1935acb51e400): (expect 1 finding: 1 `FilledRelay` event)

- [0x6f9f83e5d731b5f2467cac9e025a1a92a177316a485f8578de16f381ccbb91f9]
(https://etherscan.io/tx/0x6f9f83e5d731b5f2467cac9e025a1a92a177316a485f8578de16f381ccbb91f9): (expect 1 finding: 1 `FilledRelay` event)

- [0xa711570ee4bcbacd0c5074be1270ed96c1d9c7bcda22c6e0233d039f0539b33c]
(https://etherscan.io/tx/0xa711570ee4bcbacd0c5074be1270ed96c1d9c7bcda22c6e0233d039f0539b33c): (expect 2 findings: 2 `FilledRelay` events)

### Arbitrum

The bot behaviour can be verified with the following transactions on Arbitrum mainnet ( Contract address is:[0xb88690461ddbab6f04dfad7df66b7725942feb9c](https://arbiscan.io/address/0xb88690461ddbab6f04dfad7df66b7725942feb9c)):

- [0xfcdb0e4614849710f2195d2eb2f9b3c9fa424b3e12066288c10b39bfa514b2ac]
(https://arbiscan.io/tx/0xfcdb0e4614849710f2195d2eb2f9b3c9fa424b3e12066288c10b39bfa514b2ac): (expect 1 finding: 1 `FilledRelay` event)

- [0xfcdb0e4614849710f2195d2eb2f9b3c9fa424b3e12066288c10b39bfa514b2ac]
(https://arbiscan.io/tx/0xfcdb0e4614849710f2195d2eb2f9b3c9fa424b3e12066288c10b39bfa514b2ac): (expect 2 findings: 2 `FilledRelay` events)

- [0x7febb16d9f71f7e121baa9f4e8b10089ce695ec944db86159c17dcbd6c1a5135]
(https://arbiscan.io/tx/0x7febb16d9f71f7e121baa9f4e8b10089ce695ec944db86159c17dcbd6c1a5135): (expect 1 finding: 1 `FilledRelay` event)

### Polygon

The bot behaviour can be verified with the following transactions on Polygon mainnet ( Contract address is:[0xd3ddacae5afb00f9b9cd36ef0ed7115d7f0b584c](https://polygonscan.com/address/0xd3ddacae5afb00f9b9cd36ef0ed7115d7f0b584c)):

- [0x635c2d4ba84b962ce3076c7f227d8535427904419a99dc2474fc9582a65130de]
(https://polygonscan.com/tx/0x635c2d4ba84b962ce3076c7f227d8535427904419a99dc2474fc9582a65130de): (expect 1 finding: 1 `FilledRelay` event)

- [0x90b950e9f291dbdf1884cd289464db02787b6c8ada917b210339f96848becde7]
(https://polygonscan.com/tx/0x90b950e9f291dbdf1884cd289464db02787b6c8ada917b210339f96848becde7): (expect 1 finding: 1 `FilledRelay` event)

- [0xe7e88c74def7a4a9c6440151e556d7a31ea3f9a5fa4e33578a3d373721f1baf8]
(https://polygonscan.com/tx/0xe7e88c74def7a4a9c6440151e556d7a31ea3f9a5fa4e33578a3d373721f1baf8): (expect 2 findings: 2 `FilledRelay` events)

### Optimism

The bot behaviour can be verified with the following transactions on Optimism mainnet ( Contract address is:[0xa420b2d1c0841415a695b81e5b867bcd07dff8c9](https://optimistic.etherscan.io/address/0xa420b2d1c0841415a695b81e5b867bcd07dff8c9)):

- [0x596ffad555dafa45c8da59273cf44d46b6adfc5a18a072a0bbae7e2223fdf79b]
(https://optimistic.etherscan.io/tx/0x596ffad555dafa45c8da59273cf44d46b6adfc5a18a072a0bbae7e2223fdf79b): (expect 1 finding: 1 `FilledRelay` event)

- [0x5b5bfd5e72de8e6528a8c78c5c98ee096584624f63764179a479a2d8e0fb4378]
(https://optimistic.etherscan.io/tx/0x5b5bfd5e72de8e6528a8c78c5c98ee096584624f63764179a479a2d8e0fb4378): (expect 1 finding: 1 `FilledRelay` event)

- [0x3844813fbc068ab2e2b872cc95ef92fc386343d0cc3eac02f5cd798b25cad647]
(https://optimistic.etherscan.io/tx/0x3844813fbc068ab2e2b872cc95ef92fc386343d0cc3eac02f5cd798b25cad647): (expect 1 finding: 1 `FilledRelay` event)
