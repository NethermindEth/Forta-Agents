# BOND - Ownership Transfers

## Description

This agent detects `initializeBondTerms` call on OlympusDAO Bond Contracts.
Bond contracts are fetchet on-chain using the `redeemHelper` contract.
> Contract: 0xE1e83825613DE12E8F0502Da939523558f0B819E

## Supported Chains

- Ethereum

## Alerts

- olympus-bond-4
  - Fired when a call to `initializeBondTerms` function occurs in Bonds Contracts
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata contains:
      - `bond`: The bond contract address where the function was called
      - `_controlVariable`: Function parameter
      - `_vestingTerm`: Function parameter
      - `_minimumPrice`: Function parameter
      - `_maxPayout`: Function parameter
      - `_maxDebt`: Function parameter
      - `_initialDebt`: Function parameter
      - `_fee`: If the contain that function parameter

## Test Data

The current bonds were deployed before the redeemHelper, and in almost each of them
the `initializeBondTerms` was called before too. 

The ETH V2 Bond was deployed after the redeemHelper, but the function was called before
adding the bond to the bonds list in the reddemHelper.

So no on-chain data to test the agent
