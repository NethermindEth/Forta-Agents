# GNANA token fee-related parameter updates monitoring bot

## Description

- Supported tokens: `GNANA`
- Returns a finding every time token parameters are updated:
  - `TaxFees` fee changes: configuration changed by the owner
- When tax fee changes, `rFee` deducts the `TaxFees` from the `rAmount` and `tFee` deducts the `TaxFees` from the `tAmount`

## Supported Chains

- BNB Smart Chain
- Polygon

## Alerts

- APESWAP-3
  - Fired when `UpdateTaxFee` event is emitted on `GNANA` token contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `previousFee`: Previous fee amount
    - `currentFee`: New fee amount


