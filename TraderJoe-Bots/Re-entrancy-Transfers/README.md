# Token Transfer Re-entrancy bot

## Description

This bot detects re-entrancy in `StableJoeStaking`, `MasterChefJoeV2` , `MoneyMaker` and all of `Joetroller` markets, considering the risk of token transfer callbacks.

## Supported Chains

- Avalanche

## Alerts

- TraderJoe-25

  - Fired when a call to one of the functions involving a transfer is detected. And another call to the same contract is made.
  - Severity is always set to "High"
  - Type is always set to "Exploit"
  - Metadata contains:
    - `from`: the address source making the second call to the contract.
    - `initialCall`: selector of the function that was initially called.
    - `reEntrantCall`: selector of the function that was called in the re-entrancy case.
  - addresses contains the address of the contract where the re-entrancy happened.

## Test Data (Kovan)

This bot behavior can be verified through our PoC contracts deployed on Kovan testnet:

### PoC Contracts

- `TestJoeTroller`: 0x58ff5687eA8de62C40a8bbcbA0a062Ba9482F048.
  - Used to allow bot to fetch markets during initialization.
- `TestMarket`: 0x9d2a0AA41814CA021C8B3C4ccF49FaE70e6bE3E8
  - Test Jtoken market used to generate a reentrancy on a market.
- `TestToken`: 0x185858e30F434C07Ff19CDe798CCc00a974D6276.
  - TestToken is the contract source of reentrancies.
- `TestTarget`: 0x7157355D1b185cEBc7394fc9d6B3A69e432Dc1ad.
  - Used as a general monitored contract, other than markets.

### Test transaction

- 0x105810131a62dd88f73f59add0f15f9410dc531b375d2730daa1ef645318efd5.(reentrancy on `TestTarget`).
- 0x34103cfe0617268c77489a901beca99e2e9beb338f97544567ff8d3993df9ee7 (reentrancy on `TestMarket`).
