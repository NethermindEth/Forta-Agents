# Large deposits/redeems Agent

## Description

This agent detects deposits and redeems in PGL staking contract where the pgl amount is high. 
> High is set as a percentage of the total PGL staked.
> You can set the percentage by changing the const `THRESHOLD_PERCENTAGE` in **utils.ts**. 

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

The agent behaviour can be verified with the following transactions:

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