# PPS Ambiguity Agent

## Description

This agent ambiguity in PPS ( Price per share )

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- YEARN-8-1

  - Fired when pps value decreases.
  - Severity is always set to "high"
  - Type is always set to "info"
  - Metadata contains:
  - `ppo`: Current Value of ppo,
  - `tracker`: Older Value of ppo.

- YEARN-8-2
  - Fired when pps value change swiftly.
  - Severity is always set to "high"
  - Type is always set to "info"
  - Metadata contains:
    - `ppo`: Current Value of ppo,
    - `tracker`: Older Value of ppo.
