# Frontrun

## Description

This bot detects accounts using GMX that have an unusual amount of profitable trades. By default this is 90% but it can be changed.
## Supported Chains

- Arbitrum
- Avalanche

## Alerts

Describe each of the type of alerts fired by this agent

- GMX-07
  - Fired when an account using GMX has an unusual amount of profitable trades
  - Severity is always set to "Suspicious"
  - Type is always set to "Medium"
  - Metadata included: 

## Changing Network
By default this bot uses the Arbitrum network, but it can be changed to Avalanche by setting "jsonRpcUrl" and "traceRpcUrl" to
https://api.avax.network/ext/bc/C/rpc in the forta.config.json file. The GMX_ROUTER_ADDRESS in agent.ts must be changed to "0x5F719c2F1095F7B9fc68a68e35B51194f4b6abe8".

## Changing Profitable Trades Ratio
By default this ratio is set to trigger the bot when an account has more than 90% of profitable trades. This ratio can be changed by

## Test Data

The bot behaviour can be verified with the following transactions:

- ?????????????????????????????
