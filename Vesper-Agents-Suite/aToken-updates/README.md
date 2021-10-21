# aToken Updates Detector

## Description

This agent detects transactions that change the Aeve aTokens implementations

## Alerts

- VESPER-8
  - Fired when an Aeve token emit an Upgraded event
  - Severity is always set to "high"
  - Type is always set to "info" 
  - The alert metadata includes:
    - `tokenSymbol`: Symbol of the upgraded token
    - `tokenSymbol`: Symbol of the upgraded token
    - `newImplementation`: Address of the token new implementation
