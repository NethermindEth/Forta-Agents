## Recently-created smart contracts with very little history

### Overview

This agent reports the transactions that have in their field to an address of a contract 
recently created or with a little transaction history. The transaction will be reported if the history size
is less than `HISTORY_THRESHOLD` or if the transaction ocur in less than `TIMESTAMP_THRESHOLD` from the moment
when the contract was deployd.

## Installation

```
npm install
```

## Run

This agent use the Etherscan API to obtain the contracts history, 
then in order to increase the agent performance use your own Etherscan `API_KEY`.
In the `src/index.ts` file change the value of `ETHERSCAN_API_TOKEN` to your `API_KEY`.

Before run the agent to see how it works with real data, specify the `JSON-RPC` provider in the `forta.config.json` file. Uncomment the `jsonRpcUrl` property and set it to a websocket provider (e.g. `wss://mainnet.infura.io/ws/v3/`). Then you can run the agent using the following command:
```
npm start
```

## Test

```
npm test
```