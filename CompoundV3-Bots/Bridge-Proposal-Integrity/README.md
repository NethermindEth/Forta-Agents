# Bridge Proposal Integrity Bot

## Description

This bot monitors Compound III BaseBridgeReceiver contract for bridged proposals. Checking if they were as expected from what was sent on Ethereum.

## Supported Chains

- Polygon

## Alerts

- COMP2-5-1
  - Fired when `ProposalCreated` event was emitted on BridgeReceiver contract, and the corresponding transaction was found on mainnet.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata:
    - `chain`: Network chain name or ID where `ProposalCreated` was emitted.
    - `bridgeReceiver`: Address of `BaseBridgeReceiver` contract where the proposal was created.
    - `proposalId`: ID of the proposal.
    - `fxChild`: Address of the proposal creation message sender.
    - `txHash`: Mainnet transaction hash that originated in the proposal creation.

- COMP2-5-2
  - Fired when `ProposalCreated` event was emitted on BridgeReceiver contract, but no corresponding transaction was found on mainnet.
  - Severity is always set to "Suspicious"
  - Type is always set to "High"
  - Metadata:
    - `chain`: Network chain name or ID where `ProposalCreated` was emitted.
    - `bridgeReceiver`: Address of `BaseBridgeReceiver` contract where the proposal was created.
    - `proposalId`: ID of the proposal.
    - `fxChild`: Address of the proposal creation message sender.

## Test Data

The agent behaviour can be verified with the following transactions:

- `0xd966bdabfb86c3bc1bd159aaa6b92f5838d6450b2c02fbeb774a660fc93da1d2` - Polygon.
  - In order to get the findings, set `lastBlock` variable to `16769029` in `agent.ts` file.
  - Returns an Info Finding, the corresponding `ExecuteTransaction` event was emitted in the following trasaction `0xfff9a127bfc58dbe733775daed5b701b5d2aab54118b47b9a4a9baf930629a0b`.
