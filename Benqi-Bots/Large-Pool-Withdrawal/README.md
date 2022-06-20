# Large Withdrawals From Pools

## Description

This bot detects withdrawals from pools where the withdrawal amount is more than **X%** of the total pool size.
The threshold variable **X** is `THERSHOLD_PERCENTAGE` which is located in `agent.ts` and can be changed to get the desired results.

## Supported Chains

- Avalanche

## Alerts

- BENQI-5
  - Fired when a withdrawal from a pool is more than **X%** of the total pool size
  - Severity is always set to "Medium"
  - Type is always set to "Suspicious"
  - Metadata:
    - `qiToken`: The address of the pool where the withdrawal occurred
    - `totalSupply`: The total supply before the transaction (supply snapshot taken at previous block)
    - `redeemTokens`: The amount of tokens retrieved in the transaction

## Test Data

The bot behaviour can be verified with the following transactions:

- Avalanche Mainnet (Set `COMPTROLLER_ADDR` to `0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4`)

  - `0xb7b8e8bddfe9b0fbef66abb9cc8d316c6c63c5a920f47fa0d5a3dab234b2c7fb` (Multiple withdrawals)
    - (Set `THRESHOLD_PERCENTAGE` to 10 or more for no findings)
    - (Set `THRESHOLD_PERCENTAGE` to 5 for one finding)
    - (Set `THRESHOLD_PERCENTAGE` to 1 for multiple findings)

- Avalanche Testnet (Set `COMPTROLLER_ADDR` to `0x49446968344BDdCB407158aC103eD233866F8cE5`)
  - `0xa0bc13379684ae3687caadd926ddb7c1a19feba3beb0dc78099f9eb3a6e8f869`
    - (Set `THRESHOLD_PERCENTAGE` to 50 or less for finding)
