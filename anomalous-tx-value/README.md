## Detect anomalous Transaction Value

### Overview
This agents detects transactions that very high ETH values used. It checks every transaction one by one and evalutes each of them by `THRESHOLD`.

## Installation
```
npm install
```

## Run
Before run the agent to see how it works with real data, specify the `JSON-RPC` provider in the forta.config.json file. Uncomment the `jsonRpcUrl` property and set it to a websocket provider (e.g. wss://mainnet.infura.io/ws/v3/). Then ready to run the agent.
```
npm start
```

## Test
```
npm test
```
