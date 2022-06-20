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

## Test Data

The bot behaviour can be verified with the following transactions:

- Currently no transactions have been found
