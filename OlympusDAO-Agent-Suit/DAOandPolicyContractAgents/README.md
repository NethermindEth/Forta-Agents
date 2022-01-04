# Policy and DAO core events detection

## Description

This agent detects following events on Policy and DAO contracts.

- `AddedOwner` events
- `RemovedOwner` events
- `ChangedThreshold` events

## Supported Chains

- Ethereum

## Alerts

- Olympus-1-1

  - Fired when `AddedOwner` event is emitted.
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata contains:
    - `owner`: new added owner
    - `contract`: the contract that event is occured.

- Olympus-1-2

  - Fired when `RemovedOwner` event is emitted.
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata contains:
    - `owner`: removed owner
    - `contract`: the contract that event is occured.

- Olympus-1-3
  - Fired when `ChangedThreshold` event is emitted.
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata contains:
    - `TH`: threshold
    - `contract`: the contract that event is occured.
