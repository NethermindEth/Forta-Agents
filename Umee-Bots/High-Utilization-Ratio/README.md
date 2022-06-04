# High Utilization Rate Monitoring Bot

## Description

This bot monitors the utilization rate of pools in the Umee protocol, emitting a finding if it's large or had a large
increase.
The bot's behavior can be customized by editing the configuration fields in `src/agent.config.ts`.

## Supported Chains

- Ethereum

## Alerts

- UMEE-7-1
  - Fired when a pool's utilization ratio absolute value is large
  - Severity is always set to "low"
  - Type is always set to "info"
  - Metadata:
    - `asset`: The address of the reserve asset
    - `usageRatio`: The current usage ratio for this reserve

- UMEE-7-2
  - Fired when a pool's utilization ratio increase (relative to the previous block) is large
  - Severity is always set to "low"
  - Type is always set to "info"
  - Metadata:
    - `asset`: The address of the reserve asset
    - `usageRatio`: The current usage ratio for this reserve
    - `percentageIncrease`: The increase relative to the previous block in %

## Test Data

### Mainnet

Uncomment the lines indicated in `src/agent.config.ts` and run:

```
npm run start
```

This configuration emits UMEE-7-1 findings for reserves with usage ratios above `0` and UMEE-7-2 findings for reserves
with usage ratios that are increased by at least `0%` from the previous block (see `CONFIG.absoluteThreshold`
and `CONFIG.percentageThreshold`).
In the first block to be processed, all reserves should emit a UMEE-7-1 finding, and will do so each ~30s (see `CONFIG.alertCooldown.absolute`).
From the second block onwards, every block should trigger UMEE-7-2 findings for every reserve (see `CONFIG.alertCooldown.percentage`).
