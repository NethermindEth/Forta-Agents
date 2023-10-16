# Large Transfer DAO Proposal detection bot

## Description

This bot detects created DAO proposals for transferring large native token amounts.

## Supported Chains

- Ethereum
- BNB Chain
- Arbitrum
- Optimism
- Polygon
- Fantom
- Avalanche

## Alerts

- LARGE-TRANSFER-PROPOSAL
  - Fired when a DAO proposal to transfer a large amount of native tokens is created 
  - Severity is always set to "Medium" 
  - Type is always set to "Suspicious" 
  - Metadata includes:
    - `dao`: The DAO address
    - `proposer`: The address that created the proposal
    - `proposalId`: The ID of the proposal
    - `receiver`: The address to receive the large amount
    - `amount`: The amount to be transferred
