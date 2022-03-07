# Impossible Finance Dangerous Activities

## Description

This agent detects transactions involving Impossible Finance addresses and known dangerous addresses

## Supported Chains

- BSC

## Alerts

- IMPOSSIBLE-8
  - Fired when a transaction involves Impossible Finance addresses and known dangerous addresses
  - Severity is always set to "High"
  - Type is always set to "Suspicious"
  - Metadata contains:
    - `impossibleAddresses`: All the impossible finance addresses involved
    - `dangerousAddresses`: All the dangerous addresses involved
