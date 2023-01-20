# POLY01 -Validator Signer ETH Balance Bot

## Description
This bot monitors the ETH balance in the account (0xa8B52F02108AA5F4B675bDcC973760022D7C6020) and triggers alert;
- when account balance falls below the threshold ( 1 ETH)
- when account balance recovers and raises above the threshold

## Supported Chains
- Ethereum


## Alerts
- POLY01
  - Fired when the account balance is below or above specified threshold
  - Severity is always set to "info" 
  - Type is always set to "info"
  -Metadata fields:
   - `balance`: amount present in the account

## Test Data
