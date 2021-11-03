# Instant Withdraw Agent

## Description

Max amount that can be instantly withdrawn (requires simulation - e.g: it is possible to withdraw 30% of funds from yvDAI right now). This is helpful for debt strategies that deposit their investment to another yVault and might require funds to be more liquid but also to detect locked vaults in general.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- FORTA-7
  - Fired when a transaction consumes more gas than 1,000,000 gas
  - Severity is always set to "medium" (mention any conditions where it could be something else)
  - Type is always set to "suspicious" (mention any conditions where it could be something else)
  - Mention any other type of metadata fields included with this alert
