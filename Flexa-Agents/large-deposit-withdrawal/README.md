# Large Deposit Withdrawal Agent

## Description

This agent detects deposits and withdrawals to the Flexa staking contract with an amount that exceeds 1M USD.

> AMP token price is obtained using Chainlink data feeds.

## Supported Chains

- Ethereum

## Alerts

- FLEXA-1
  - Fired when a transaction deposits/withdraws a large amount to/from Flexa Staking contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `supplier`: Address of the user executing the deposit/withdrawal.
    - `amount`: Amount of tokens transfered.

## Test Data

There's no current transaction including a Deposit or Withdrawal with an amount greater than 1M USD. To verify the agent behavior, you can change the threshold to a lower amount and test with the following transactions:

- 0x9a5e5e8b72893af9975719c9ae4bcb8bd133168fbbfa0b6c6752e29165906ec2 (Deposit - a threshold of 200 USD or above generates a finding)
- 0x0ba0fd557d24b0ae7622d713493ca79a1ebec73c9f363aa98dc0610f395d6c60 (Withdrawal - a threshold of 1100 USD or above generates a finding)
