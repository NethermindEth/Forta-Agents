# Curve Finance Agents Suite

## Description

This module provides a list of agents related to Curve contracts.

## Supported Chains

- Ethereum

## Agent Alerts

- `address.provider.ownership.transfer`<br/>
Detect transfer of ownership in the address provider contract.
- `pool.migration`<br/>
Detect a pool migration.
- `deploy.metapool`<br/>
Detect the deployment of a new meta pool.
- `registry.add.pool`<br/>
Detect adding a new pool to the registry contract.
- `registry.remove.pool`<br/>
Detect the removal of a pool from the registry contract.
- `apply.newfee.ts`<br/>
Detect the Curve DAO contract setting a new fee for a pool.
- `curve.dao.claim.many`<br/>
Detect a call to the function `claim_many` on the Curve DAO contract.
- `curve.dao.killing.gauge`<br/>
Detect killing of a gauge on the Curve DAO.
- `curve.gauge.set.rewards`<br/>
Detect a change in the rewards on Curve-Gauge.
- `curve.dao.create.lockevent`<br/>
Detect when a new `LockEvent` is emitted upon a new lock being created.
- `kill.me`<br/>
Detect a call to the function `kill_me` on the Curve-Stable-Swap contract.
- `ramp`<br/>
Detect if the function `ramp` was called on Curve-Dao which ramps up the reward amount of a token.
- `stop.ramp`<br/>
Detect if the function `stop_ramp` was called on Curve-Dao.
- `remove.imbalance.liquidity`<br/>
Detect if the evet `RemoveLiquidityImbalance` was emitted on the StableSwap Exchange contract.
- `unkill`<br/>
Detect if the function `unkill\_me` was called on the Stable-Swap contract.
