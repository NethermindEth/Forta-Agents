# Large Deposit/Withdraw agent

## Description

This agent detects transactions with large Deposit/Withdrawals from Yearn Vaults

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- FORTA-1
  - Fired when a transaction consumes more gas than 1,000,000 gas
  - Severity is always set to "medium" (mention any conditions where it could be something else)
  - Type is always set to "suspicious" (mention any conditions where it could be something else)
  - Mention any other type of metadata fields included with this alert

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x1b71dcc24657989f920d627c7768f545d70fcb861c9a05824f7f5d056968aeee (1,094,700 gas)
- 0x8df0579bf65e859f87c45b485b8f1879c56bc818043c3a0d6870c410b5013266 (2,348,226 gas)
