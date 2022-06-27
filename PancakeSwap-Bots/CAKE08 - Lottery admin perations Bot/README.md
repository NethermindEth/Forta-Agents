# PancakeSwap Lottery Admin Operations Detection Agent

## Description

This agent detects PancakeSwap Lottery Admin Operations:
- setMinAndMaxTicketPriceInCake function call
- setMaxNumberTicketsPerBuy function call
- NewRandomGenerator event
- NewOperatorAndTreasuryAndInjectorAddresses event

## Supported Chains

- Binance Smart Chain (BSC)

## Alerts

Describe each of the type of alerts fired by this agent

- PCSLottery-1
  - Triggered when a NewRandomGenerator Event is detected
- PCSLottery-2
  - Triggered when a NewOperatorAndTreasuryAndInjectorAddresses Event is detected
- PCSLottery-3
  - Triggered when a function call is detected for:
    - setMinAndMaxTicketPriceInCake
    - setMaxNumberTicketsPerBuy

