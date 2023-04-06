# Private Key Compromise Bot

## Description

This bot identifies possible private key compromises by analyzing all the native transfers and ERC20 token transfers. Analyzes all the receiver addresses to see if they receive more than a certain amount of transfers in a certain time. These settings can be set inside `src/bot.config.ts`.

> The bot uses block explorer APIs. In order to increase performance, add your own API keys to the `src/keys.ts` file.

## Supported Chains

- Ethereum
- Optimism
- BNB Smart Chain
- Polygon
- Fantom
- Arbitrum
- Avalanche

## Alerts

- PKC-1

  - Fired when a receiver address receives more than a certain amount of transfers in a certain time either native or ERC20 tokens.
  - Severity is always set to "High".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - `attacker`: The attacker address
    - `victims`: The victims whose funds are transferred to the attacker
    - `anomalyScore`: Score of how anomalous the alert is (0-1)
  - Labels contain:
    - Label 1:
      - `entity`: The transaction's hash
      - `entityType`: The type of the entity, always set to "Transaction"
      - `label`: The type of the label, always set to "Suspicious"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.6`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 2:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: Sender addresses of the funds
      - `label`: The type of the label, always set to "Victim"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.6`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 3:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: Receiver address of the funds
      - `label`: The type of the label, always set to "Attacker"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.6`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`

## Test Data

The bot behaviour can be verified with the following commands:

On Ethereum:

```
npm run tx 0x3461c5e3a72afb27c28d894330ab67283dec76a21b1512f5160c66cec0ada98a,0xbc66e4ba40f4711d18073f5568f7aae633900f8fd8658181edfcebe3d8382fb8,0x639c3bdfb7306aede9039fb9eead22de3a4f34450fe4a5774e7679037492c7b8,0x4ac7783ebf4e2758db29062335561ae26622bac5f6447f32f0db4c06dd11818d
```

```
npm run tx 0x8f338a787398fe8925319b60e73f9ba5757a1a72b711e8d05ab081b50260ac7d,0x10136159d5991dd1ab4e444d9db0d4c750760f9ea3201e78d5697f863b9b945e,0x1ce1ca7053f5c330aa7f167f1d4580855051db05d321a1b0f730391a1ebf09d7,0x8d1f0196f996cd07e36c3ee1b0eaff8e2da0745742f1dc4dec36069d5d894a6f
```
