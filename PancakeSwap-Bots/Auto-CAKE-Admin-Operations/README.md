# CakeVault Admin Operations Detection Bot

## Description

This bot detects the following CakeVault Admin Operations:
- `setAdmin` function call
- `setTreasury` function call
- `setPerformanceFee` function call
- `setCallFee` function call
- `setWithdrawFee` function call
- `Pause` event emission
- `Unpause` event emission

## Supported Chains

- Binance Smart Chain (BSC)

## Alerts

- CAKE-6-1
  - Triggered when a `Pause` event is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".

- CAKE-6-2
  - Triggered when a `Unpause` event is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  
- CAKE-6-3
  - Triggered when a `setAdmin` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `admin`: The new admin address
 
- CAKE-6-4
  - Triggered when a `setTreasury` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains: 
    - `treasury`: The new treasury address.

- CAKE-6-5
  - Triggered when a `setPerformanceFee` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains: 
    - `performanceFee`: The performance fee.

- CAKE-6-6
  - Triggered when a `setCallFee` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains: 
    - `callFee`: The call fee.

- CAKE-6-7
  - Triggered when a `setWithdrawFee` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains: 
    - `withdrawFee`: The withdraw fee.
  
## Test Data

The bot behaviour can be verified with the following transactions on BSC testnet (PoC contract address is 
: [0x5af4cDEDe5650513d666fe1a9F57d78F84aEBEe9]
(https://testnet.bscscan.com/address/0x5af4cDEDe5650513d666fe1a9F57d78F84aEBEe9))

  - [0xaf9ade636a6ee034aa2ff51d3c0df23149de99bfc3c2082662d14ee5e9b698eb]
(https://testnet.bscscan.com/tx/0xaf9ade636a6ee034aa2ff51d3c0df23149de99bfc3c2082662d14ee5e9b698eb)
(expect 1 finding: for `Pause` event) 

  - [0x735e31541195be12f0787022a530f4a609d380db63cee5a4640a002f0df139a7]
(https://testnet.bscscan.com/tx/0x735e31541195be12f0787022a530f4a609d380db63cee5a4640a002f0df139a7)
(expect 2 findings: for `Pause` and `Unpause` event)

  - [0x92c42f87145f78dcf99f738a04a5b213a3f49db7c868f2c9804ee03f5ec1a162]
(https://testnet.bscscan.com/tx/0x92c42f87145f78dcf99f738a04a5b213a3f49db7c868f2c9804ee03f5ec1a162)
(expect 1 finding: for `Unpause` and `Withdraw` event)

  - [0xccddf511db319ecf6dd19ae4f1da581bc0d82845baa1f61b2363f250e5561d4c]
(https://testnet.bscscan.com/tx/0xccddf511db319ecf6dd19ae4f1da581bc0d82845baa1f61b2363f250e5561d4c)
(expect 1 finding: for `setAdmin()`)

  - [0xe2e397cdbe829fee3d89750c93358b677fbb427d429f8c647b6d2fb735baa197]
(https://testnet.bscscan.com/tx/0xe2e397cdbe829fee3d89750c93358b677fbb427d429f8c647b6d2fb735baa197)
(expect 1 finding: for `setTreasury()`)

  - [0x0020999c941c6596e3df7465ebb35c5131a5f673f133738cad5e0d9ccf0928c2]
(https://testnet.bscscan.com/tx/0x0020999c941c6596e3df7465ebb35c5131a5f673f133738cad5e0d9ccf0928c2)
(expect 1 finding: for `setPerformanceFee()`)

  - [0x2e31fb99e0ca7020625e7dccc20ff911e2dc487dae5114d91fc7220a728f1e52]
(https://testnet.bscscan.com/tx/0x2e31fb99e0ca7020625e7dccc20ff911e2dc487dae5114d91fc7220a728f1e52)
(expect 1 finding: for `setCallFee()`)

  - [0x63091dee6e2f8981bce7ea8797845d59d09f22dc1f567f3cb5735181910e87ef]
(https://testnet.bscscan.com/tx/0x63091dee6e2f8981bce7ea8797845d59d09f22dc1f567f3cb5735181910e87ef)
(expect 1 finding: for `setWithdrawFee()`)
