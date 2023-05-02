# Governance Events Bot

## Description

This bot detects events related to governance actions in Compound v3 Comet contracts.

The Comet deployment addresses for each network can be configured in the
`agent.config.ts` file.

## Supported Chains

- Ethereum
- Polygon

## Alerts

- COMP2-2-1
  - Fired when there's a pause action on a Comet contract
  - Severity is always set to "Medium"
  - Type is always set to "Info"
  - Metadata:
    - `chain`: Network chain ID or name
    - `comet`: Address of the related Comet contract
    - `supplyPaused`: Status of supply pausing
    - `transferPaused`: Status of supply pausing
    - `withdrawPaused`: Status of supply pausing
    - `absorbPaused`: Status of supply pausing
    - `buyPaused`: Status of supply pausing

- COMP2-2-2
  - Fired when there's a reserve withdrawal on a Comet contract
  - Severity is always set to "High"
  - Type is always set to "Info"
  - Metadata:
    - `chain`: Network chain ID or name
    - `comet`: Address of the related Comet contract
    - `to`: Address of the withdrawal recipient
    - `amount`: Amount withdrawn

- COMP2-2-3
  - Fired when a Comet contract approves an ERC20 allowance for another contract
  - Severity is always set to "High"
  - Type is always set to "Info"
  - Metadata:
    - `chain`: Network chain ID or name
    - `comet`: Address of the related Comet contract
    - `token`: Address of the related token
    - `spender`: Address of the allowance spender
    - `amount`: Allowance amount

## Test Data

No emission of these events was found on existing Comet contracts. To check
the unit test cases and results, run `npm run test`.
