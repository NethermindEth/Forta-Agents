# Compound v2 Comptroller Contract Pause Functionality Bot

## Description

This bot detects `NewPauseGuardian`, `ActionPaused(string, bool)`(global action), and `ActionPaused(address,string,bool)`(an action on a market) event emissions from Compound v2's `Comptroller` contract.

## Supported Chains

- Ethereum

## Alerts

- NETH-COMP-PAUSE-EVENT-1

  - Fired when an action is paused on a market
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Addresses includes the emitting address of the event
  - Metadata:
    - `CToken`: Market address
    - `action`: Action of the market
    - `pauseState`: Pause state of the action

- NETH-COMP-PAUSE-EVENT-2

  - Fired when an action is globally paused
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Addresses includes the emitting address of the event
  - Metadata:
    - `action`: Global action
    - `pauseState`: Pause state of the action

- NETH-COMP-PAUSE-EVENT-3
  - Fired when the pause guardian is changed
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Addresses includes the emitting address of the event
  - Metadata:
    - `oldPauseGuardian`: Old pause guardian address
    - `newPauseGuardian`: New pause guardian address

## Test Data

### Mainnet

The bot behaviour can be verified with the following transactions:

- `npm run tx 0x98144f1dcc9d916563041f68d11444925f817d4a857357fce73978a335a9a06b` - [ActionPaused (in a market)](https://etherscan.io/tx/0x98144f1dcc9d916563041f68d11444925f817d4a857357fce73978a335a9a06b)
- `npm run tx 0x0b2c0c863252edf8928c269d6349a0e33ea58dbfc82a1d75d7b6fd9815c0e8ac` - [NewPauseGuardian](https://etherscan.io/tx/0x0b2c0c863252edf8928c269d6349a0e33ea58dbfc82a1d75d7b6fd9815c0e8ac)

### Goerli Testnet (PoC)

> For this test, set a Goerli Testnet RPC url as `jsonRpcUrl` in your `forta.config.json` file and run:

- `npm run tx 0x283f9600499249b25d909d367b3c55bf7803435a92e49de541eeb00fe8ae18f2` - [ActionPaused (in a market)](https://goerli.etherscan.io/tx/0x283f9600499249b25d909d367b3c55bf7803435a92e49de541eeb00fe8ae18f2)
- `npm run tx 0x5c47eeeef4b1277655fde0da22f6847d74bb19371def37febd0434469683f09b` - [ActionPaused (a global action)](https://goerli.etherscan.io/tx/0x5c47eeeef4b1277655fde0da22f6847d74bb19371def37febd0434469683f09b)
- `npm run tx 0xd826034d85702dcf47335e2a5a5edd000aab7b6078a347cf05846007076c2824` - [NewPauseGuardian](https://goerli.etherscan.io/tx/0xd826034d85702dcf47335e2a5a5edd000aab7b6078a347cf05846007076c2824)
