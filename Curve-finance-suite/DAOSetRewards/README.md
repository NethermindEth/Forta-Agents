# Curve DAO set Gauge Rewards

## Description

This agent detect when Curve DAO tries set rewards options on a Gauge

## Supported Chains

- Ethereum

## Alerts

- curve-11
  - Fired when Curve DAO call `set_rewards` function with `true` as argument.
  - Severity is always set to "Medium"
  - Type is always set to "Info"
  - Metadata contains:
    - `gauge`: Contract where the method was called.
    - `rewardContract`: Address of the staking contract.
    - `sigs`: A concatenation of three four-byte function signatures: `stake`, `withdraw` and `getReward`.
    - `rewardTokens`: Array of rewards tokens received from the staking contract.
