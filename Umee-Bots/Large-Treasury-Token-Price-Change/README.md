# Large Treasury Token Price Change Bot

## Description

This bot detects large price changes in tokens exchange rates using data provided by
Chainlink feeds. The bot behavior can be customized through the fields in
`src/agent.config.ts`.

## Supported Chains

- Ethereum

## Alerts

- UMEE-5-1
  - Fired when a price change is large (based on the configured thresholds)
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata:
    - `feed`: feed description (e.g. "ETH/USD")
    - `answer`: current feed answer
    - `diff`: absolute difference between the previous and current values
    - `percentageDiff`: ratio between current and previous values (in %)

- UMEE-5-2
  - Fired when a monitored chainlink feed answer is a negative value
  - Severity is always set to "unknown"
  - Type is always set to "info"
  - Metadata:
    - `feed`: feed description (e.g. "ETH/USD")

## Test Data

### Ethereum Mainnet

Uncomment the lines indicated in `src/agent.config.ts`, set an Ethereum mainnet RPC
(e.g. `https://eth-rpc.gateway.pokt.network`) as `jsonRpcUrl` in your
`forta.config.json` file and run:

```
npm run start
```

This will emit a finding in every block because both the interval and the absolute
threshold are set to 0.

**Note**: Since this bot monitors prices starting from the bot startup and Chainlink
feeds usually take some minutes to update price data, a similar test with a non-zero
threshold can be done, but would take some minutes to show a finding.
