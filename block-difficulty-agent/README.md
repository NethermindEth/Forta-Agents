## Detect anomalous Changes in Difficulty

### Overview

This agent detects blocks with unusual changes in difficulty. The agent check the changes in difficulty in the previous `NUMBER_OF_BLOCKS_TO_CHECK` and verify if the last changes is inside the standard deviation.

## Installation

```
npm install
```

## Run

Before run the agent to see how it works with real data, specify the `JSON-RPC` provider in the forta.config.json file. Uncomment the `jsonRpcUrl` property and set it to a websocket provider (e.g. `wss://mainnet.infura.io/ws/v3/`) if deploying in production, els use HTTP provider if testing with jest. Then ready to run the agent.

```
npm start
```

## Test

```
npm test
```
