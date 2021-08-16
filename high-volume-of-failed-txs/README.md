## High volume of failed transactions

### Overview

This agent reports protocols that receive a high volume of failed transactions. It checks each transaction one by one and keeps the information of the transactions failed by `INTERSTING_PROTOCOLS` that occurred in the last` TIME_INTERVAL`. A protocol is reported when the volume of transactions exceeded the `HIGH_FAILURE_THRESHOLD`.

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
