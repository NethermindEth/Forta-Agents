## Detect Contract interactions which are inside MEV bundle

### Overview

This agent detects contract interactions that inside in a `MEV bundle`. Agent keeps list of `interesting protocols` and check transaction address includes one of these protocols. Also agent is using `Flashbots API` to check whether a block include a MEV bundle or not. 
`https://blocks.flashbots.net/#api-Flashbots-GetV1Blocks`

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

