# Large Borrower Allocation Bot

## Description

This bot detects when a borrower's allocation is high. The bot listens to `ScheduledBorrowerAllocationChange` event emissions, and if the `newAllocation` exceeds the `threshold`, it creates a finding.
> The static threshold can be adjusted by changing `THRESHOLD` in `utils.ts`. 

## Supported Chains

- Ethereum

## Alerts

- DYDX-16
  - Fired when `ScheduledBorrowerAllocationChange` event is emitted with a `newAllocation` that exceeds the threshold.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `borrower`: Address of borrower.
    - `oldAllocation`: Previous allocation of borrower.
    - `newAllocation`: New allocation of borrower.
    - `epochNumber`: Current epoch number.