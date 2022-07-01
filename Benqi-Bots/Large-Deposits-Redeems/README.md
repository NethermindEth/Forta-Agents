# Large deposits/redeems bot

## Description

This bot detects deposits and redeems in PGL staking contract when the pgl amount is high.

> High is set as a percentage of the total PGL staked.
> You can adjust the percentage by changing the const `THRESHOLD_PERCENTAGE` in **utils.ts**.

## Supported Chains

- Avalanche

## Alerts

- BENQI-7-1

  - Fired when `deposit` function is called with a pglAmount that exceeds the threshold.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata includes:
    - `user`: address of the user calling the `deposit` function.
    - `pglAmount`: amount of pgl to deposit.

- BENQI-7-2
  - Fired when `redeem` function is called with a pglAmount that exceeds the threshold.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata includes:
    - `user`: address of the user calling the `redeem` function.
    - `pglAmount`: amount of pgl to redeem.

## Test Data

The bot behaviour can be verified with the following transactions:

### Mainnet (Avalanche)

- 0x9d9e21b406829272571163ad1e4e0b77b13e86f367c9f2719309e58914af0385

  - `deposit` call
  - `pglAmount`: 262185675274
  - `totalSupplies`: 5031023705
  - `result`: generates a finding with **1%** percentage.

- 0xfc365e195da561f33ca7432b09d2b20fe6faf119c72ba7356e54193323eac754

  - `deposit` call
  - `pglAmount`: 47158000000
  - `totalSupplies`: 141644
  - `result`: generates a finding with **<=33293300%** percentage.

- 0x920688e0a96225522df278899ac0f21ef49e73f38800085f9ca948034c4259ac

  - `redeem` call
  - `pglAmount`: 3392276209
  - `totalSupplies`: 111275646568
  - `result`: generates a finding with **<=2%** percentage.

  ### Testnet (Avalanche)

  These transactions have been generated through our PoC contract deployed on avalanche testnet.

  > note that `provideHandleTransaction` inputs in the default export of `agent.ts` need to be changed to use `TESTNET_PGL_STAKING` instead of `PGL_STAKING_CONTRACT`.

  - 0x554adca0e92abcf5ae60c5ccb4c5078ba1393f90f36339a436b31a395c530a9d

    - `redeem` call
    - `pglAmount`: 500
    - `totalSupplies`: 2000
    - `result`: generates a finding with **<=25%** percentage.

  - 0x16aa257b6a0fa23a85146e87dd90fcd26140bd0cba4c16e6f46c5e92e4e567ad
    - `deposit` call
    - `pglAmount`: 150
    - `totalSupplies`: 1500
    - `result`: generates a finding with **<=10%** percentage.
