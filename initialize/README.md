## Detect Multiple Initialize function calls

### Overview

This agent detects multiple calls to initialize function.

## Installation

```
npm install
```

## Run

Before run the agent to see how it works with real data, specify the `JSON-RPC` provider in the forta.config.json file. Uncomment the `jsonRpcUrl` property and set it to a websocket provider (e.g. `wss://mainnet.infura.io/ws/v3/`) if deploying in production, else use HTTP provider if testing with jest. Then ready to run the agent.

```
npm start
```

## Test

```
npm run test
```
