# Successful transactions with internal failures

## Overview

This agent detects successful transactions that have one or more failed internal transactions

## Installation

```
npm install
```

## Run

This agent use the Etherscan API to obtain the contracts history, 
then in order to increase the agent performance uses your own Etherscan `API_KEY`.
In the `src/index.ts` file change the value of `ETHERSCAN_API_TOKEN` to your `API_KEY`.

Before run the agent to see how it works with real data, specify the `JSON-RPC` provider in the `forta.config.json` file. Uncomment the `jsonRpcUrl` property and set it to a websocket provider (e.g. `wss://mainnet.infura.io/ws/v3/`). Then you can run the agent using the following command:
```
npm start
```

## Test

```
npm test
```
