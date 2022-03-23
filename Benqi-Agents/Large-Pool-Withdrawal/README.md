# Large Withdrawals From Pools

## Description

This agent detects withdrawals from pools where the withdrawal amount is more than __X%__ of the total pool size.
The threshold variable __X__ is `THERSHOLD_PERCENTAGE` which is located in `agent.ts` and can be changed to get the desired results.

## Supported Chains

- Avalanche

## Alerts

- BENQI-5
  - Fired when a withdrawal from a pool is more than __X%__ of the total pool size
  - Severity is always set to "Medium"
  - Type is always set to "Suspicious"
  - Metadata:
    - `qiToken`: The address of the pool where the withdrawal occurred
    - `totalSupply`: The total supply before the transaction (supply snapshot taken at previous block)
    - `redeemTokens`: The amount of tokens retrieved in the transaction

## Test Data

The agent behaviour can be verified with the following transactions:

- 0xb7b8e8bddfe9b0fbef66abb9cc8d316c6c63c5a920f47fa0d5a3dab234b2c7fb (Multiple withdrawals)
  - (Set `THRESHOLD_PERCENTAGE` to 0.10 for no findings)
  - (Set `THRESHOLD_PERCENTAGE` to 0.05 for one finding)
  - (Set `THRESHOLD_PERCENTAGE` to 0.01 for multiple findings)
