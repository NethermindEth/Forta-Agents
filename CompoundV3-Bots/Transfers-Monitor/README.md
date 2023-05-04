# Base assets transfer Monitor

## Description

This bot detects when a `Transfer` event on the base contract is directed to a comet contract, but not associated with a `BuyCollateral` or `Supply` event from Comet.

## Supported Chains

- Ethereum
- Polygon

## Alerts

- COMP2-3
  - Fired when a `Transfer` event is emitted on a base asset, directed to a comet contract, but there's no matching `BuyCollateral` or `Supply` event.
  - Severity is always set to "Medium"
  - Type is always set to "Info"
  - Metadata:
    - `cometcontract`: address of the comet contract where the transfer is directed.
    - `sender`: the first side of the transfer.
    - `transferAmount`: amount that was transfered to the comet contract

## Test Data

No emission of these events was found on existing Comet contracts. To check the unit test cases and results, run `npm run test`.
