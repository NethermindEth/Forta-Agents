# Large Inactive Balance in Safety Module.

## Description

This bot detect users with large Inactive balance for the next Epoch in dYdX Safety Module.

## Supported Chains

- Ethereum

## Alerts

- FORTA-1
  - Fired when a transaction contains a Tether transfer over 10,000 USDT
  - Severity is always set to "low" (mention any conditions where it could be something else)
  - Type is always set to "info" (mention any conditions where it could be something else)
  - Mention any other type of metadata fields included with this alert

## Test Data

The bot behaviour can be verified with the following transactions (Mainnet):

- 0x278542214ed3fe02880fb8c1df2f0eed81f72f2f00bef41233aa2aa714c057b0
