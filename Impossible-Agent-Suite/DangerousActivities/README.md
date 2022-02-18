# Impossible Finance Dangerous Activities

## Description

This agent detects transactions involving impossible addresses and dangerous addresses

## Supported Chains

- BSC

## Alerts

- impossible-dangerous
  - Fired when a transaction involves impossible addresses and dangerous addresses
  - Severity is always set to "High"
  - Type is always set to "Suspicious"
  - Metadata contains:
    - `impossibleAddresses`: All the impossible finance addresses involved
    - `dangerousAddresses`: All the dangerous addresses involved
