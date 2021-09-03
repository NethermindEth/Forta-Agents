# Detect All Upgrade Events

## Overview

The agent detects transactions which includes any upgrade event that executed through Open Zeppelin proxy contract. It filter events according to upgrade event signature which is `Upgraded(address)`.

## Installation

```
npm install
```

## Run

Before run the agent to see how it works with real data, specify the `JSON-RPC` provider in the forta.config.json file. Uncomment the `jsonRpcUrl` property and set it to a websocket provider (e.g. `wss://mainnet.infura.io/ws/v3/`). Then ready to run the agent.

```
npm start
```

## Test

```
npm test
```
