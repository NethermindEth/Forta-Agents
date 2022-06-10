# Deposit/Borrow In The Same Transaction as Flash Loan

## Description

This bot monitors deposit or borrow events in the same transaction along with a flash loan event.

## Supported Chains

- Ethereum

## Alerts

- UMEE-14-1

  - Fired when `Deposit` and `FlashLoan` events are emitted in the same transaction
  - Severity is always set to "info"
  - Type is always set to "info"
  - metadata:
    - from: Address of the sender of the transaction.
    - to: Address of the message call’s recipient.

- UMEE-14-2
  - Fired when `Borrow` and `FlashLoan` events are emitted in the same transaction
  - Severity is always set to "info"
  - Type is always set to "info"
  - metadata:
    - from: Address of the sender of the transaction.
    - to: Address of the message call’s recipient.

## Test Data

### Kovan Testnet (PoC)

In order to run the bot in Kovan Testnet's mock Lending Pool address, comment out line 3 and uncomment line 5 indicated in `src/utils.ts`, and set a Kovan testnet RPC (e.g.
`https://kovan.poa.network`) as `jsonRpcUrl` in your `forta.config.json` file.

To verify the bot behaviour, run the following commands:

- FlashLoan-Deposit: `npm run tx 0x708e240ded87236b9f7898f2ee78c79d2378492157ea21e7778fa5e4666d893b`
- FlashLoan-Borrow:
  `npm run tx 0x37430937b869a1b8c49e9b3146c55d1c3d974468e068af52a2312082356ba9ab`
- FlashLoan-Deposit-Borrow: `npm run tx 0x3c8381506c73c7c0bd228ed62ef40d577f802b5c32d7869da482e786202133e6`
