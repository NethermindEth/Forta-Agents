# Frontrun

## Description

This bot detects GMX swap transactions that have been frontrun through a sandwich attack

## Supported Chains

- Arbitrum
- Avalanche

## Alerts

Describe each of the type of alerts fired by this bot

- GMX-05
  - Fired when a GMX trade transaction has been frontrun through a sandwich attack 
  - Severity is always set to "Suspicious"
  - Type is always set to "Medium"
  - Metadata included: sandwichFrontTransaction, victimTransaction, sandwichBackTransaction, victimAddress, victimTokenIn, victimTokenOut, victimTokenInAmount, victimTokenOutAmount, frontrunnerAddress, frontrunnerProfit.

## Changing Network
By default this bot uses the Arbitrum network, but it can be changed to Avalanche by setting "jsonRpcUrl" and "traceRpcUrl" to
https://api.avax.network/ext/bc/C/rpc in the forta.config.json file. The GMX_ROUTER_ADDRESS in agent.ts must be changed to "0x5F719c2F1095F7B9fc68a68e35B51194f4b6abe8".

## Test Data

The bot behaviour can be verified with the following transactions:

- ?????????????????????????????
