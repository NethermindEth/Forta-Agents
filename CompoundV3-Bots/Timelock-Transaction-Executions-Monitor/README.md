# Timelock Transaction Executions Monitor Bot

## Description

This bot detects transaction executions from bridge receivers' timelocks and
analyzes proposal data to both inform of proposal executions but also notify
on possible suspicious actions.

This is done by first monitoring `ExecuteTransaction` logs from the brige
receiver's local timelock and then matching the executed transactions with
proposal execution calls through `ProposalExecuted` logs in the same
transaction and previous `ProposalCreated` logs.

Findings are emitted on basically all cases - i.e. when a proposal was fully
executed (all the expected calls were made), when a proposal was not fully
executed (some call was not made, which should be a totally unexpected
situation) and when an executed transaction could not be associated with any
proposal execution call, which should be a really problematic scenario.

In the case a proposal's parameters simply could not be found with the current
parameters, since it requires fetching `ProposalCreated` entries from previous
blocks, a bot log will be emitted for debugging, so in the case of a
`COMP2-6-3` finding it would be desirable to check the bot logs.

The bridge receiver addresses, as well as additional parameters for each
network can be configured in the `agent.config.ts` file.

## Supported Chains

- Polygon

## Alerts

- COMP2-6-1
  - Fired when there's a successful proposal execution on a bridge receiver
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata:
    - `chain`: Network chain ID or name
    - `bridgeReceiver`: Address of the related bridge receiver contract
    - `timelock`: Address of the timelock associated with the bridge receiver
    - `proposalId`: ID of the proposal that was executed

- COMP2-6-2
  - Fired when a proposal is not fully executed as per its initial definition
  and the timelock executed transactions (edge case)
  - Severity is always set to "Unknown"
  - Type is always set to "Suspicious"
  - Metadata:
    - `chain`: Network chain ID or name
    - `bridgeReceiver`: Address of the related bridge receiver contract
    - `timelock`: Address of the timelock associated with the bridge receiver
    - `proposalId`: ID of the proposal that was executed

- COMP2-6-3
  - Fired when a transaction is executed in the bridge receiver's timelock but
  it could not be associated with any proposal execution. This can be related
  to the bot failing to get the proposal creation data, which can be easily
  avoided by reasonable fetching parameters, but if so a log is also emitted.
  - Severity is always set to "Unknown"
  - Type is always set to "Suspicious"
  - Metadata:
    - `chain`: Network chain ID or name
    - `bridgeReceiver`: Address of the related bridge receiver contract
    - `timelock`: Address of the timelock associated with the bridge receiver
    - `txHash`: Timelock hash of the executed transaction
    - `target`: Target of the transaction in question
    - `value`: Value included in the transaction, in wei
    - `signature`: Signature of the method being called
    - `data`: Transaction call data
    - `eta`: Transaction ETA

## Test Data

To test this bot against real data, beyond the unit tests, which can be
executed through `npm run test`, set up a Polygon RPC on your
`forta.config.json` file and run:

```
npm run tx 0x6eef97e8cda567347cd08f864b38cd327c9e3a869e3f973f6f72a37360eb5add
```

This transaction is the one in which the first proposal ever submitted to the
Polygon bridge receiver was executed. The expected result is a `COMP2-6-1`
finding confirming the proposal was fully executed.
As mentioned, considering this analysis depends on fetching proposal creation
information, changing the configuration field `creationFetchingBlockRange` to,
e.g., `10_000` makes it so the proposal creation event can't be found, since
it's ~47k blocks earlier than the execution. With this, `COMP2-6-3` findings
for each of the executed transactions will be emitted, along with bot logs
highlighting the proposal data could not be found.
