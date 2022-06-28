# PancakeSwap Lottery Admin Operations Detection Bot

## Description

This bot detects PancakeSwap Lottery Admin Operations:
- setMinAndMaxTicketPriceInCake function call
- setMaxNumberTicketsPerBuy function call
- NewRandomGenerator event
- NewOperatorAndTreasuryAndInjectorAddresses event

## Supported Chains

- Binance Smart Chain (BSC)

## Alerts

- CAKE-8-1
  - Triggered when a NewRandomGenerator Event is detected
  - Metadata: randomGenerator
  - Type: Info
  - Severity: Info
- CAKE-8-2
  - Triggered when a NewOperatorAndTreasuryAndInjectorAddresses Event is detected
  - Metadata: operator, treasury, injector
  - Type: Info
  - Severity: Info
- CAKE-8-3
  - Triggered when a function call is detected for:
    - setMinAndMaxTicketPriceInCake
      - Metadata: _minPriceTicketInCake, _maxPriceTicketInCake 
    - setMaxNumberTicketsPerBuy
      - Metadata: _maxNumberTicketsPerBuy
  - Type: Info
  - Severity: Info
  
## Test Data

- BSC TestNet Test Contract Address: 0x1a79f536EB9E93570C30fd23Debf2a068Ea33d33
- Test Transactions hashes:
  - setMinAndMaxTicketPriceInCake(expect 1 finding): 0x0653b663d16f09c1dda3df427f836fe72ba2acbb722bb3748b324e390c8b252b
  - setMaxNumberTicketsPerBuy(expect 1 finding): 0x8dbc3f96e49e667328032cbd28aeb1c277af496dae5d3920a19f07908377a567
  - one event(expect 1 finding): 0x121955f6cb89d37ffad2245ebdbddb0ab9ec1e14de18c6ea710cc9a2d1338e75
  - two events(expect 2 findings): 0xfccc69304202688ff76b6304ecd135e5d7893dbe39910ebac3b011d146934f22
  - wrong event (expect 0 findings): 0x91ce161468cb3d8f5d4d781c2895ad3cc2bd6f5c69f856b512c24145738b73d2

