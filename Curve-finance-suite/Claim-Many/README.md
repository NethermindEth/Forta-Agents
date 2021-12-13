# Claim Many agent

## Description

This agent detects successful `claim_many` calls to CurveDAO Fee Distribution Contract.

## Supported Chains

- Ethereum

## Alerts

- CURVE-1
  - Fired when `claim_many` function is executed successfully
  - Severity is always set to "low"
  - Type is always set to "info"
  - Metadata contains:
    - `from`: Address that execute the `claim_many` call
    - `receivers`: List of addresses to claim for

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x77c90f18853fb54947577e877d1d9b3bcfeece0f91ae41b841ef0b90ae5ca59c (successfully claim many call)
