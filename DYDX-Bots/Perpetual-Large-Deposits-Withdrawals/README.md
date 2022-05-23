# Large deposits withdrawals on perpetual exchange

## Description

This bot detects deposits and withdrawals on dYdX perpetual exchange contract with large transfered amounts.

> The bot can operate in two different modes, used to determine the threshold of a _large_ transfered amount.
>
> - `STATIC` mode refers to the bot using a static predefined threshold.
> - `PERCENTAGE` refers to setting the threshold as a percentage of the contract balance.

> In order to switch between the two modes, change `STATIC_CONFG` to `DYNAMIC_CONFG` in agent.ts, L62.

## Supported Chains

- Ethereum

## Alerts

- DYDX-1-1

- Fired when `LogDeposit` event is emitted on dYdX perpetual contract with a large quantized amount.
- Severity is always set to "Info".
- Type is always set to "Info".
- Metadata contains:

  - `quantizedAmount`: tokens amount that was deposited.
  - `starkKey`: stark key of the user making the deposit.
  - `token`: the token that was transfered.

- DYDX-1-2

  - Fired when `LogWithdrawalPerformed` event is emitted on dYdX perpetual contract with a large quantized amount.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata contains:
    - `quantizedAmount`: tokens amount that was withdrawn.
    - `token`: the token that was transfered.
    - `recipient`: ethereum address receiving the tokens.
    - `ownerKey`: stark key of user withdrawing his tokens.

- DYDX-1-3

  - Fired when `LogMintWithdrawalPerformed` event is emitted on dYdX perpetual contract with a large quantized amount.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `quantizedAmount`: tokens amount that was withdrawn.
    - `token`: the asset that was transfered.
    - `assetId`: Id of the minted asset.
    - `ownerKey`: stark key of the recipient.

- DYDX-1-4

  - Fired when one of the events is emitted with an asset different from the system asset.
  - Severity is always set to "High".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - `quantizedAmount`: tokens amount that was deposited or withdrawn.
    - `starkKey`: stark key of the user involved in the transfer.
    - `assetType`: assetType that is different from the system one.

## Test Data

The bot behaviour can be verified with the following transactions, using the default configurations:

### Mainnet

The following transactions return a finding with the `STATIC` mode only.

- 0x30c630fe50e492eeff514cab7590921ab21c4fc224cfff7bad0f82ee2a47db0f (`LogWithdrawalPerformed`).
  - returns a finding when `thresholdData` in config.ts, L12 is set to 594666727637 or less.
- 0x77387abbc97753343fda4008b543ef01d8ccd987b887d20c047b748e3894e8cb (`LogDeposit`)
  - returns a finding when `thresholdData` in config.ts, L12 is set to 125071534000 or less.

### Kovan Testnet

The following test transactions generated through our `PoC` contracts:

> - `Proxy` PoC contract address: `0x6Fc6DCD68e995b90234b332ef66218565377c898`.
> - `StarkPerpetual` PoC contract address: `0x68AA0d8Dc6D41B9563c95e8E2C4b9F7062456F1a`.
> - `TestToken` PoC contract address: `0xE9B5c2a173E5D84Bf5Be455b39496592f50F3e7B`.

- 0xde143e68cfd5ad370f9a69a421b78ef491701d15920e57aa7d3012c7d5115fc3 (`LogDeposit` event)

  - `quantizedAmount`: 1200000 (12% of total balance).
  - `STATIC` mode returns a finding when `thresholdData` in config.ts, L12 is set to `1200000` or less.
  - `PERCENTAGE` mode returns a finding when `thresholdData` in config.ts, L19 is set to `12%` or less.

- 0xd59936486ca06ebc4fb19d6fa79b9f176fdf89b781c9b3969368eea1b1c8f9f7 (`LogWithdrawalPerformed` event)

  - `quantizedAmount`: 1500000 (15% of total balance).
  - `STATIC` mode returns a finding when `thresholdData` in config.ts, L12 is set to `1500000` or less.
  - `PERCENTAGE` mode returns a finding when `thresholdData` in config.ts, L19 is set to `15%` or less.

- 0x0c9c58454e88830197675a09a2e2a172bc9d40889db1797cd4833ddd7bf85041 (`LogMintWithdrawalPerformed` event )

  - `quantizedAmount`: 1500000 (11% of total balance).
  - `STATIC` mode returns a finding when `thresholdData` in config.ts, L12 is set to `1100000` or less.
  - `PERCENTAGE` mode returns a finding when `thresholdData` in config.ts, L19 is set to `11%` or less.

- 0xcdb223dd6fd9e8be3caca28443d6def72ed39e8e2223d257917422720f457583 (`LogMintWithdrawalPerformed` event with a different assetType)
  - generates a suspecious finding with both modes.
