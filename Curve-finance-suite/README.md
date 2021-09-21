# Curve Finance Agents Suit

## Description

This module provides a list of agents related to Curve contracts.

## Supported Chains

- Ethereum

## Agent Alerts

- Detect ownership transfer in address provider contract
- Detect pool migration
- Detect deploying new meta pool
- Detect adding new pool to Registry contract
- Detect removing an existing pool from Registry contract
- Detect Setting of new Fee on curve dao contract.
- Detect call to `claim_many` function on curve dao contract.
- Detect Killing of a Gauge on curve Dao.
- Detect change in the Rewards on Curve-Gauge.
- Detect when a new LockEvent is emmitted on creating a new lock.
- Detect call to `kill_me` function on Curve-Stable-Swap contract.
- Detect if the `ramp` function got called on Curve-Dao which ramps up the payout amount of a token.
- Detect if the function to remove imbalance of liquiidity got called on StableSwap Exchange contract.
- Detect if `stop_ramp` got called on Curve-Dao.
- Detect if the unkill method got called on Stable-swap contract.
