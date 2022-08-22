# Frontrun

## Description

This bot detects GMX swap transactions that have been frontrun through a sandwich attack

## Supported Chains

- Arbitrum
- Avalanche

## Alerts


- GMX-05
  - Fired when a GMX swap transaction has been frontrun through a sandwich attack 
  - Severity is always set to "Suspicious"
  - Type is always set to "Medium"
  - Metadata included:
    - `sandwichFrontTransaction`: Transaction hash of the front sandwich transaction
    - `victimTransaction`: Transaction hash of the victim transaction
    - `sandwichBackTransaction`: Transaction hash of the back sandwich transaction
    - `victimAddress`: Address of the victim
    - `victimTokenIn`: Address of the token the victim traded in
    - `victimTokenOut`: Address of the token the victim traded out
    - `victimTokenInAmount`: Amount of tokens the victim traded in
    - `victimTokenOutAmount`: Amount of tokens the victim traded out
    - `frontrunnerAddress`: Address of the frontrunner
    - `frontrunnerProfit`: Profit the frontrunner obtained through the attack, expressed as the amount of `tokenIn` obtained

## Test Data

The bot behaviour can be verified with the following transactions:

- Currently no transactions have been found
