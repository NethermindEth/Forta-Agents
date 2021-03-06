# Umee Oracle Stale Price Data Detection Bot

## Description

This bot monitors reserve assets price oracle data to check if it has not been updated for longer than a configured interval, also updating its local records when a new asset is added or an asset source is changed.
The bot behavior can be customized in `src/agent.config.ts`.

## Supported Chains

- Ethereum

## Alerts

- UMEE-3
  - Fired when any asset price gets stale.
  - Severity is always set to "Medium"
  - Type is always set to "Suspicious"
  - Metadata contains:
    - `asset`: The address of the asset
    - `source`: The address of the source
    - `referenceTimestamp`: The latest price update timestamp for the asset

## Test Data

### Mainnet

Uncomment the lines indicated in `src/agent.config.ts` and run:

```
npm run start
```

Since uncommenting the lines indicated in `src/agent.config.ts` for the mainnet test will set the staleness threshold to `0`, there will be findings for every asset in every block.

### Kovan Testnet (PoC)

The following test was generated by interacting with PoC contracts (available at the `PoC/` directory) deployed on the Kovan testnet.

To check the results, uncomment the lines indicated in `src/agent.config.ts`, set a Kovan testnet RPC (e.g. `https://kovan.poa.network`) as `jsonRpcUrl` in your `forta.config.json` file and run:

```
npm run block 31914255
```

In the block `31914255`, `MockUmeeOracle` had been deployed with static `latestTimestamp` at  `Thu Jan 01, 1970`, so the bot emits finding for the staling price.
