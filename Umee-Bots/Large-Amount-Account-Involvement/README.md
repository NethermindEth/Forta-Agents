# Large Amount of Account Involvement

## Description

This bot detects transactions in which large amount of addresses are involved.

The accounts that are needed to be monitored must be added inside the `monitoredAddresses` array in `src/agent.config.ts` file.

The minimum amount of addresses that should trigger the alert is set by the `threshold` value in `src/agent.config.ts` file.

## Supported Chains

- Ethereum

## Alerts

- UMEE-13
  - Fired when a transaction contains large amount of addresses
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `from`: Address of the initiator of the transaction
    - `to`: Address of the transaction recipient
    - `monitoredAddresses`: Addresses of the monitored accounts that are involved in the transaction
    - `amountOfInvolvedAddresses`: Number of total addresses that are involved in the transaction

## Test Data

Uncomment the lines indicated in `src/agent.config.ts` and set a `traceRpcUrl` for mainnet in your `forta.config.json` file. The testing configuration monitors 'UMEE', 'Lending Pool', 'Umee Oracle' and a random user address.

### Mainnet

```
npm run tx 0xf4f10458c28e01d3938460fcfb1290a7c9f4f836a4ec3cf61c638a5ed798ca2a,0x21e15b1d8ebdf1bc1c40b4ace261fac72648625c0d962819d6a94d0879ad182e
```

The first transaction will create a finding in which there are 2 monitored addresses because 2 out of 4 addresses that are monitored are both involved in this transaction. Likewise, the second transaction will create a finding with 3 monitored addresses.

### Kovan Testnet (PoC)

In order to check the results, uncomment the lines indicated in `src/agent.config.ts`, set a trace-enabled Kovan testnet RPC as `jsonRpcUrl` and `traceRpcUrl` in your `forta.config.json` file and run:

```
npm run tx 0x78fe7dddec7325817213b04827214e49b7a484d4fa61eded78914c88b0c28410
```

The accounts involved in this transaction are more than threshold value. Since a contract inside `monitoredAddresses` at `src/agent.config.ts` is involved in this transaction, this command will create a finding.
