# Balancer Stable Pool Depegging Bot

## Description

This bot detects possible de-peggings by analyzing changes in stable pools amplification factors, since, in this case,
it should be low or decrease significantly to make the swap curve closer to a constant product as opposed to a constant
sum curve.

These changes can be analyzed using three independent thresholds associated to different alerts:

- An absolute value threshold: Related to the end value of the change.
- A decrease threshold: Related to the difference between the start and the end value of the change.
- A decrease percentage threshold: Related to the decrease percentage between the start and end values of the change.

agent.config.ts thresholds:

    // Absolute amplification parameter value at and below which a finding will be emitted (decimal places are not
    // considered) (optional).
    valueThreshold: "10000",

    // Minimum amplification parameter drop from the previous value at and above which a finding will be emitted
    // (decimal places are not considered) (optional).
    decreaseThreshold: "10000",

    // Minimum amplification parameter drop percentage from the previous value at and above which a finding will be
    // emitted (in %) (optional).
    decreasePercentageThreshold: "40.5"

## Supported Chains

- Ethereum
- Polygon
- Arbitrum

## Alerts

- BAL-9-1

  - Fired when a stable pool amplification factor will be changed to be at or below the value threshold set in the configuration
  - Severity is always set to "unknown"
  - Type is always set to "info"
  - Metadata:
    - `pool`: The address of the monitored pool
    - `startValue`: The start value of the amplification factor change
    - `endValue`: The end value of the amplification factor change

- BAL-9-2

  - Fired when a stable pool amplification factor will be decreased by at least the decrease threshold set in the configuration
  - Severity is always set to "unknown"
  - Type is always set to "info"
  - Metadata:
    - `pool`: The address of the monitored pool
    - `startValue`: The start value of the amplification factor change
    - `endValue`: The end value of the amplification factor change
    - `decrease`: The difference between the start and end amplification factor values

- BAL-9-3
  - Fired when a stable pool amplification factor will be decreased by at least the percentage set in the configuration
  - Severity is always set to "unknown"
  - Type is always set to "info"
  - Metadata:
    - `pool`: The address of the monitored pool
    - `startValue`: The start value of the amplification factor change
    - `endValue`: The end value of the amplification factor change
    - `decreasePercentage`: The decrease in % between the start and end amplification factor values

## Test Data

### Mainnet

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set an Ethereum Mainnet Testnet RPC url as
> `jsonRpcUrl` in your `forta.config.json` file.

```
npm run tx 0x718362a7e6ab57219724c682139a877eb8f867c2461945f4e4c5415c33997fce
```

The test configuration is adjusted so all findings are emitted for this amplification parameter change, since the
`endValue` is equal to the `valueThreshold` and the absolute and percentage decreases are larger than
`decreaseThreshold` and `decreasePercentageThreshold`.

### Kovan Testnet (PoC)

> For this test, uncomment the lines indicated in `src/agent.config.ts` and set a Kovan Testnet RPC url as `jsonRpcUrl`
> in your `forta.config.json` file.

```
npm run tx 0x7de61b51b57cd99477afad954271f122e3e641f2456471998da107b0667f291b
```

As noted in the PoC at `PoC/MockStablePoolGroup.sol`, this should emit 6 findings, in sequence: BAL-9-1, BAL-9-2,
BAL-9-3, BAL-9-1, BAL-9-2 and BAL-9-3.
