## Gnosis Safe admin changes

### Overview

This agent reports transactions that emits gnosis safe events of admin or threshold changes.
The reported events are can be found [here](https://github.com/gnosis/safe-contracts/blob/main/contracts/base/OwnerManager.sol#L9-L11)

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
