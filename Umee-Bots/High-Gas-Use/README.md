# High Amount of Gas Use

## Description

This bot detects transactions in which high amount of gas is used and specified accounts are involved.

The accounts that are needed to be monitored must be added inside the `monitoredAddresses` array in `src/agent.config.ts` file.

The minimum amount of gas that should trigger the alert is set by the `mediumGasThreshold`, `highGasThreshold` and `criticalGasThreshold` values in `src/agent.config.ts` file.

## Supported Chains

- Ethereum

## Alerts

- UMEE-12
  - Fired when a transaction uses high amount of gas
  - Severity is always set to "Medium", "High" or "Critical" depending on the amount of gas use
  - Type is always set to "Suspicious"
  - Metadata:
    - `from`: Address of the initiator of the transaction
    - `to`: Address of the transaction recipient
    - `monitoredAddresses`: Addresses of the monitored accounts that are involved in the transaction
    - `gasUsed`: Amount of gas spent in the transaction

## Test Data

For testing purposes, the test configurations in `src/agent.config.ts` monitors 'Umee', 'Lending Pool', 'Umee Oracle' and a random user address.

### Mainnet

Uncomment the lines indicated in `src/agent.config.ts`, add a trace-enabled Mainnet RPC as both `jsonRpcUrl` and `traceRpcUrl` in your `forta.config.json` file and run:

```
npm run tx 0x70e41c3279d8014841665f480f1022569ca3fb840a387baa6b69dd8c74f49675
```

This transaction will create a finding in which there are 2 monitored addresses because 2 out of 4 addresses that are monitored are both involved in this transaction.

### Kovan Testnet (PoC)

In order to check the results, uncomment the lines indicated in `src/agent.config.ts`, set a trace-enabled Kovan testnet RPC as both `jsonRpcUrl` and `traceRpcUrl` in your `forta.config.json` file and run:

Medium severity:

```
npm run tx 0x5b5e4611841d52794847507757b0e96f6d13c491c275bd781a642e84348d37fb
```

High severity:

```
npm run tx 0x69fa4948f92a526374eb393f5cbcad4745093ed4a20eb8cf892a9c19a14d7cdb
```

Critical severity:

```
npm run tx 0x44b594d1ace27d1c6db49b38ff4d25b3f02ba58b3c6e6efe1eeda67e76c0ffed
```

These transactions use different amount of gas above thresholds. Since a contract inside `monitoredAddresses` at `src/agent.config.ts` is involved in these transactions, these commands will create a finding.
