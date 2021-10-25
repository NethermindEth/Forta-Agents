# Vesper Comptroller & CToken NewImplementation Checking Agent

## Description

This agent detects two things:

- NewImplementation event from Compound Comptroller
- NewImplementation event from a cToken returned by comptroller.getAllMarkets()

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- Vesper-7-1
  - Fired when a NewImplementation event is emitted from the Compound Comptroller address
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - You can find the following information in the metadata:
    - `newAddress`: the address of the new implementation contract
 
- Vesper-7-2
  - Fired when a NewImplementation event is emitted from a cToken returned by comptroller.getAllMarkets()
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - You can find the following information in the metadata: 
    - `newAddress`: the address of the new implementation contract
