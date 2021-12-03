# Curve Finance Agents Suite

## Description

This module provides a list of agents related to Curve contracts.

## Supported Chains

- Ethereum

## Agent Alerts

- `address.provider.ownership.transfer`
Detect transfer of ownership in the address provider contract.
- `pool.migration`
Detect a pool migration.
- `deploy.metapool`
Detect the deployment of a new meta pool.
- `registry.add.pool`
Detect adding a new pool to the registry contract.
- `registry.remove.pool`
Detect the removal of a pool from the registry contract.
- `apply.newfee.ts`
Detect the Curve DAO contract setting a new fee for a pool.
- `curve.dao.claim.many`
Detect a call to the function `claim_many` on the Curve DAO contract.
- `curve.dao.killing.gauge`
Detect killing of a gauge on the Curve DAO.
- `curve.gauge.set.rewards`
Detect a change in the rewards on Curve-Gauge.
- `curve.dao.create.lockevent`
Detect when a new `LockEvent` is emitted upon a new lock being created.
- `kill.me`
Detect a call to the function `kill_me` on the Curve-Stable-Swap contract.
- `ramp`
Detect if the function `ramp` was called on Curve-Dao which ramps up the reward amount of a token.
- `stop.ramp`
Detect if the function `stop_ramp` was called on Curve-Dao.
- `remove.imbalance.liquidity`
Detect if the function `RemoveLiquidityImbalance` was called on the StableSwap Exchange contract`.
- `unkill`
Detect if the function `unkill\_me` was called on the Stable-Swap contract.
