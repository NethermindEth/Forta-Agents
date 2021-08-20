## Detect COMPOUND Governance Transactions

### Overview

This agent detects transactions that include `COMPOUND` governance events. It checks events that match with any governance events which are listed below.
Governance Event:
- `CREATE` Proposal
- `VOTE` Proposal
- `QUEUE` Proposal
- `EXECUTE` Proposal
- `CANCEL` Proposal

Agent reports two type of findings;
1. Successed Transactions: Successful governance transactions
2. Failed Transactions: Failed governance transactions

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
