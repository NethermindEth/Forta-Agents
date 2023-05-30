# Bridge Proposal Integrity Bot

## Description

This bot monitors Compound v3 BaseBridgeReceiver contract for bridged proposals,
checking if they were as expected from what was sent on Ethereum.

This is done by monitoring `ProposalCreated` events on the Polygon
BridgeReceiver contract and then trying to fetch the corresponding message
passing that lead to this creation on Mainnet - in this case, a transaction
execution from the Governor timelock to the Polygon bridge.

## Supported Chains

- Polygon

Currently the only supported chain is indeed Polygon. Some features were added
to make it simpler to add other chains (i.e. network-specific configuration
fields), but to do this same procedure in other chains it'd be necessary to know
how the network bridge works.

## Alerts

- COMP2-5-1
  - Fired when `ProposalCreated` event was emitted on BridgeReceiver contract,
  and the corresponding transaction was found on mainnet.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata:
    - `chain`: Network chain name or ID where `ProposalCreated` was emitted.
    - `bridgeReceiver`: Address of `BaseBridgeReceiver` contract where the
    proposal was created.
    - `proposalId`: ID of the proposal.
    - `fxChild`: Address of the proposal creation message sender.
    - `txHash`: Mainnet transaction hash that originated in the proposal
    creation.

- COMP2-5-2
  - Fired when `ProposalCreated` event was emitted on BridgeReceiver contract,
  but no corresponding transaction was found on mainnet.
  - Severity is always set to "Suspicious"
  - Type is always set to "High"
  - Metadata:
    - `chain`: Network chain name or ID where `ProposalCreated` was emitted.
    - `bridgeReceiver`: Address of `BaseBridgeReceiver` contract where the
    proposal was created.
    - `proposalId`: ID of the proposal.
    - `fxChild`: Address of the proposal creation message sender.

## Test Data

Besides unit tests, which can be executed through `npm run test`, you can also
test this bot with real data. First, set up a Polygon Mainnet RPC in your
`forta.config.json` file, then enable the debug mode in `agent.config.ts` by
setting the `DEBUG` flag to `true`. This will mainly make it so the current
Ethereum mainnet block is set as `16769029` so we can get the message passing
logs in a realistic range. Now, run the following command to execute the bot in
a transaction:

```
npm run tx 0xd966bdabfb86c3bc1bd159aaa6b92f5838d6450b2c02fbeb774a660fc93da1d2
```

This will return an Info finding, as there was indeed a message passing for this
proposal creation in the transaction
`0xfff9a127bfc58dbe733775daed5b701b5d2aab54118b47b9a4a9baf930629a0b`.
To get a Suspicious finding, you can increase the `DEBUG_LAST_BLOCK` to make it
so it's not included in the message pass fetching range, which should be
unrealistic.
