# PPS Ambiguity Agent

## Description

This agent detects anomalies in PPS ( Price per share )

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- YEARN-8-1

  - Fired when pps value decreases.
  - Severity is always set to "high"
  - Type is always set to "info"
  - Metadata contains:
  - `pps`: Current Value of pps,
  - `tracker`: Older Value of pps.

- YEARN-8-2
  - Fired when pps value change swiftly (change >10%).
  - Severity is always set to "high"
  - Type is always set to "info"
  - Metadata contains:
    - `pps`: Current Value of pps,
    - `tracker`: Older Value of pps.
