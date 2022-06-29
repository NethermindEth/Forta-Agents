# PancakeSwap Lottery Admin Operations Detection Bot

## Description

This bot detects the following PancakeSwap Lottery Admin Operations:
- `setMinAndMaxTicketPriceInCake` function call
- `setMaxNumberTicketsPerBuy` function call
- `NewRandomGenerator` event
- `NewOperatorAndTreasuryAndInjectorAddresses` event

## Supported Chains

- Binance Smart Chain (BSC)

## Alerts

- CAKE-8-1
  - Triggered when a `NewRandomGenerator` event is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `randomGenerator`: The address of the new random generator.
  
- CAKE-8-2
  - Triggered when a `NewOperatorAndTreasuryAndInjectorAddresses` event is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
   - `operator`: The address of the new operator.
   - `treasury`: The address of the new treasury.
   - `injector`: The address of the new injector.
  
- CAKE-8-3
  - Triggered when a `setMinAndMaxTicketPriceInCake` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
   - Metadata contains:
    - `_minPriceTicketInCake`: The minimum price of the ticket in CAKE.
    - `_maxPriceTicketInCake`: The maximum price of the ticket in CAKE.
 
- CAKE-8-4
  - Triggered when a `setMaxNumberTicketsPerBuy` function call is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains: 
    - `_maxNumberTicketsPerBuy`: The maximum number of tickets per buy.
  
## Test Data

The bot behaviour can be verified with the following transactions on BSC testnet (PoC [contract address](https://testnet.bscscan.com/address/0x1a79f536EB9E93570C30fd23Debf2a068Ea33d33)):

  - `setMinAndMaxTicketPriceInCake` (expect 1 finding): 0x0653b663d16f09c1dda3df427f836fe72ba2acbb722bb3748b324e390c8b252b
  - `setMaxNumberTicketsPerBuy` (expect 1 finding): 0x8dbc3f96e49e667328032cbd28aeb1c277af496dae5d3920a19f07908377a567
  - One event (expect 1 finding): 0x121955f6cb89d37ffad2245ebdbddb0ab9ec1e14de18c6ea710cc9a2d1338e75
  - Two events(expect 2 findings): 0xfccc69304202688ff76b6304ecd135e5d7893dbe39910ebac3b011d146934f22
  - Wrong event (expect 0 findings): 0x91ce161468cb3d8f5d4d781c2895ad3cc2bd6f5c69f856b512c24145738b73d2
