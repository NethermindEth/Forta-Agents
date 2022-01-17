# Pickle Jars Large Deposits/Withdraws

## Description

This agent detects Large Deposits/Withdraws in Pickle Jars Contracts
> Jars are fetched from PickleRegistry 0xF7C2DCFF5E947a617288792e289984a2721C4671

## Supported Chains

- Ethereum

## Alerts

- pickle-2-1
  - Fired when a transaction contains a large deposit to a Pickle Jar 
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata contains:
    - `jar`: The address of the Jar where the deposit occurred
    - `from`: Address that executed the deposit
    - `amount`: Shares received

- pickle-2-2
  - Fired when a transaction contains a large withdraw in a Pickle Jar 
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata contains:
    - `jar`: The address of the Jar where the withdraw occurred
    - `from`: Address that executed the withdraw
    - `amount`: Shares withdrawn
