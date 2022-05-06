#  Fee related parameter updates on tokens monitoring bot

## Description

- Supported tokens: `GNANA`
- Returns a finding every time token parameters are updated:
    - `TaxFees` fee changes
    - `reflect` fee changes

## Supported Chains

- BNB Smart Chain

## Alerts
- APESWAP-3
  - Fired when `UpdateTaxFee` and `Transfer` event is emitted on  `RBEP20`. And  when the ratio between total supply and reflect supply changes. (The ratio change after `reflect`, `transfer` and `transferFrom` transactions on `RBEP20`)
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `feeType`: tax or reflect fee
    - `previousFee`: Previous fee amount
    - `currentFee`: New fee amount

## Test Data

The bot behavior can be verified with the following transaction:

