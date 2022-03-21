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

- 0x92b971e2c84b79cf7df949ee3645f0e28310ac0fe94b7d436f34236dc8fc8d14 
  - (Withdrawal of `7264199798` from total supply of `35508760798710315`)
