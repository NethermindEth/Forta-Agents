# CakeVault Admin Operations Detection Bot

## Description

This bot detects the following CakeVault Admin Operations:
- `setAdmin` function call
- `setTreasury` function call
- `setPerformanceFee` function call
- `setCallFee` function call
- `setWithdrawFee` function call
- `Pause` event
- `Unpause` event

## Supported Chains

- Binance Smart Chain (BSC)

## Alerts

- CAKE-6-1
  - Triggered when a `Pause` event is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains: -
  
- CAKE-6-2
  - Triggered when a `Unpause` event is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains: -
  
- CAKE-6-3
  - Triggered when a `setAdmin` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
   - Metadata contains:
    - `_admin`: The new admin address
 
- CAKE-6-4
  - Triggered when a `setTreasury` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains: 
    - `_treasury`: The new treasury address.

- CAKE-6-5
  - Triggered when a `setPerformanceFee` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains: 
    - `_performanceFee`: The performance fee.

- CAKE-6-6
  - Triggered when a `setCallFee` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains: 
    - `_callFee`: The call fee.

- CAKE-6-6
  - Triggered when a `setWithdrawFee` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains: 
    - `_withdrawFee`: The withdraw fee.
  
## Test Data

The bot behaviour can be verified with the following transactions on BSC testnet (PoC [contract address](https://testnet.bscscan.com/address/0x1a79f536EB9E93570C30fd23Debf2a068Ea33d33)):

  - 0x0653b663d16f09c1dda3df427f836fe72ba2acbb722bb3748b324e390c8b252b: (expect 1 finding: `for setMinAndMaxTicketPriceInCake`) 
  - 0x8dbc3f96e49e667328032cbd28aeb1c277af496dae5d3920a19f07908377a567: (expect 1 finding: `setMaxNumberTicketsPerBuy`)
  - 0x121955f6cb89d37ffad2245ebdbddb0ab9ec1e14de18c6ea710cc9a2d1338e75: (expect 1 finding: `one event` )
  - 0xfccc69304202688ff76b6304ecd135e5d7893dbe39910ebac3b011d146934f22: (expect 2 findings: `two events`)
  - 0x91ce161468cb3d8f5d4d781c2895ad3cc2bd6f5c69f856b512c24145738b73d2: (expect 0 findings: `wrong event` )
