# Large Tether Transfer Agent

## Description

This agent detects transactions with large Tether transfers

## Supported Chains

- Ethereum
- List any other chains this agent can support e.g. BSC

## Alerts

Describe each of the type of alerts fired by this agent

- FORTA-1
  - Fired when a transaction contains a Tether transfer over 10,000 USDT
  - Severity is always set to "low" (mention any conditions where it could be something else)
  - Type is always set to "info" (mention any conditions where it could be something else)
  - Mention any other type of metadata fields included with this alert

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x81e9918e248d14d78ff7b697355fd9f456c6d7881486ed14fdfb69db16631154 (USDT-TCR drained)
