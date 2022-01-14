# Pickle Finance Idle Funds Agent

## Description

This agent detects Pickle Finance Jars with too much Idle Funds

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- PICKLE-1
  - Fired when a pickle jar has too much idle funds. There is a threshold in the `agent.ts` file for defining `too much`.
  - Severity is always set to "Info". 
  - Type is always set to "Info".
  - The metadata contains:
    - `pickleJar`: The jar with too much idle funds
    - `idleFundsPercent`: How much value is idle.

