# Large Deposits-Withdrawals Bot

## Description

This bot detects large changes in TVL/ Monitor large deposits/withdrawals.

> - `Stake` and `Unstake` events are used to monitor staking/unstaking in IFAllocationMaster contract.
> - `Purchase` and `Withdraw` events are used to detect purchase and withdraws with their whitelist and giveaway versions.
> - Large is defined based on a precent of the IDIA token total supply for staking contract and the received total stake weight for sale contracts.
> - Percentage can be changed in `utils.ts`, L09.


## Supported Chains

- Binance Smart Chain.

## Alerts

- IMPOSSIBLE-4-1

  - Fired when `Stake`, `Unstake` events are emitted from `IF Allocation Master V1.5` staking contract with a large amount.
  - Severity is always set to "info".
  - Type is always set to "info".
  - Metadata contains:
    - `from` : Address of the user who executed the transaction.
    - `amount`: The amount that was staked/unstaked.

- IMPOSSIBLE-4-2

  - Fired when `Purchase`, `Withdraw` events are emitted from sale contracts with a large amount.
  - Severity is always set to "info".
  - Type is always set to "info".
  - Metadata contains:
    - `saleContract`: Address of the sale contract where the event was emitted.
    - `from`: Address of the user who executed the transaction.
    - `amount`: The amount that was purchased or withdrawn.
