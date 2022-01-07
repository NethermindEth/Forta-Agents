# OlympusDAO Stake Contract Management

## Description

This agent detects calls to management function on Stake Contract from OlympusDAO (`0xc58e923bf8a00e4361fe3f4275226a543d7d3ce6`).

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- OlympusDAO-4
  - Fired when a management method is called on Stake Contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `functionCalled`: Name of the function called.

## Test Data

The agent behaviour can be verified with the following transactions:

- `0xe79915b690b4684964f08bfed462e194e72215ceb7399bc1cc855fe9ced60f63` (`removeRecipient` called).
- `0xf2a50306e49960fbf7071048457f6745d2b643bc40e74a156ab359f8547effae` (`addRecipient` called).
- `0x32586931cd30c20717e94021b47d1383f8d7b55321927799c5a7aec9aca83681` (`setAdjustment` called).
