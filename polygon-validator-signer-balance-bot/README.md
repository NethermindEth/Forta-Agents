# Polygon Validator Signer ETH Balance Bot

## Description

This bot monitors the ETH balance in the account [0xa8B52F02108AA5F4B675bDcC973760022D7C6020](https://etherscan.io/address/0xa8B52F02108AA5F4B675bDcC973760022D7C6020) and triggers an alert;

- when account balance falls below the threshold (1 ETH)
- when account balance recovers and raises above the threshold

> The monitored address and the ETH threshold can be configured in src/constants.ts, L3-4.

## Supported Chains

- Ethereum

## Alerts

- POLY-01

  - Fired when the account balance is below specified threshold
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata fields:
    - `balance`: monitored address ETH balance

- POLY-02
  - Fired when the account balance is above specified threshold
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata fields:
    - `balance`: monitored address ETH balance
