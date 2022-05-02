# Large BANANA Token Mint

## Description

This bot detects transactions with large Banana mints

## Supported Chains

- BNBChain


## Alerts

Describe each of the type of alerts fired by this agent

- APESWAP-1
  - Fired when a transaction contains a BANANA token mint exceeding  20,000 
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata contains the following field: 
    - `value`: the minted amount of BANANA tokens
    - `from`: the address of the initiator of the transaction
    - `to`: BANANA token contract address

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x63b996196eaff9bc14983fd9c4fcf9b6d64762b499bd1a78346045291f4535e9 (25,000 BANANA )

