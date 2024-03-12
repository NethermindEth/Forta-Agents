# Private Key Compromise Bot

## Description

This bot identifies possible private key compromises by analyzing all the native transfers and ERC20 token transfers. Analyzes all the receiver addresses to see if they receive more than a certain amount of transfers in a certain time. These settings can be set inside `src/bot.config.ts`.

The bot emits an alert under the following conditions:

- If a receiver receives more than 2 transfers from different addresses, either native or ERC20 token (can be 3 native & 0 ERC20 token, 3 ERC20 token & 0 native, 1 native & 2 ERC20 etc.), in 6 hours, it emits an alert.
- The receiver address should be an EOA and should have less than 500 total transactions. (to reduce false positives because of CEX addresses)
- in order for an ERC20 token transfer to be counted as a drain, the victim’s token balance is checked whether it’s zero for that particular token that is transferred.
- in order for a native transfer to be counted as a drain, the bot checks the sender’s balance to see if the leftover amount is below the threshold for that particular network. These thresholds can be set inside `src/bot.config.ts`.

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
  - Severity is always set to "Low".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - `attacker`: The attacker address
    - `victims`: The victims whose funds are transferred to the attacker
    - `transferredAssets`: Addresses of assets that were transferred out
    - `anomalyScore`: Score of how anomalous the alert is (0-1)
  - Labels contain:
    - Label 1:
      - `entity`: The transaction's hash
      - `entityType`: The type of the entity, always set to "Transaction"
      - `label`: The type of the label, always set to "Suspicious"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.3`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 2:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: Receiver address of the funds
      - `label`: The type of the label, always set to "Attacker"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.3`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 3:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: Sender addresses of the funds
      - `label`: The type of the label, always set to "Victim"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.3`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`

- PKC-2

  - Fired when a sender address from PKC-1 alert has been inactive for one week.
  - Severity is always set to "High".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - `attacker`: The attacker address
    - `victims`: The victims whose funds are transferred to the attacker
    - `transferredAssets`: Addresses of assets that were transferred out
    - `anomalyScore`: Score of how anomalous the alert is (0-1)
    - `txHash`: Transaction hash which triggered the `PKC-1` alert
  - Labels contain:
    - Label 1:
      - `entity`: The transaction's hash
      - `entityType`: The type of the entity, always set to "Transaction"
      - `label`: The type of the label, always set to "Suspicious"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.6`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 2:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: Receiver address of the funds
      - `label`: The type of the label, always set to "Attacker"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.6`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 3:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: Sender addresses of the funds that was inactive for one week.
      - `label`: The type of the label, always set to "Victim"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.6`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`

- PKC-3

  - Fired when a receiver address receives more than a certain amount of transfers over a certain amount of value in a certain time either native or ERC20 tokens.
  - Severity is always set to "Low".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - `attacker`: The attacker address
    - `victims`: The victims whose funds are transferred to the attacker
    - `transferredAssets`: Addresses of assets that were transferred out
    - `anomalyScore`: Score of how anomalous the alert is (0-1)
  - Labels contain:
    - Label 1:
      - `entity`: The transaction's hash
      - `entityType`: The type of the entity, always set to "Transaction"
      - `label`: The type of the label, always set to "Suspicious"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.3`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 2:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: Receiver address of the funds
      - `label`: The type of the label, always set to "Attacker"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.3`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 3:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: Sender addresses of the funds
      - `label`: The type of the label, always set to "Victim"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.3`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`

- PKC-4

  - Fired when a receiver address receives more than twenty transfers in a certain time either native or ERC20 tokens.
  - Severity is always set to "High".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - `attacker`: The attacker address
    - `victims`: The victims whose funds are transferred to the attacker
    - `transferredAssets`: Addresses of assets that were transferred out
    - `anomalyScore`: Score of how anomalous the alert is (0-1)
  - Labels contain:
    - Label 1:
      - `entity`: The transaction's hash
      - `entityType`: The type of the entity, always set to "Transaction"
      - `label`: The type of the label, always set to "Suspicious"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.3`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 2:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: Receiver address of the funds
      - `label`: The type of the label, always set to "Attacker"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.3`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`
    - Label 3:
      - `entityType`: The type of the entity, always set to "Address"
      - `entity`: Sender addresses of the funds
      - `label`: The type of the label, always set to "Victim"
      - `confidence`: The confidence level of the transaction being suspicious (0-1). Always set to `0.3`
      - `remove`: Boolean indicating whether the label is removed. Always set to `false`

## Test Data

The bot behaviour can be verified with the following command:

On Ethereum:

```
npm run tx 0x8f338a787398fe8925319b60e73f9ba5757a1a72b711e8d05ab081b50260ac7d,0x10136159d5991dd1ab4e444d9db0d4c750760f9ea3201e78d5697f863b9b945e,0x1ce1ca7053f5c330aa7f167f1d4580855051db05d321a1b0f730391a1ebf09d7
```
_Thunder Terminal_ exploit ([source article](https://www.theblock.co/post/269269/on-chain-trading-platform-thunder-terminal-hacked-for-86-5-eth-zachxbt))
```
npm run tx 0xed773474da7266a71640738f3a1df5d88c0b6ab2d6b252513acd289a269f2a75,0x3e19662c7b49a87bdbf343a4ffe7f348ffb1df71ce5d77a6078d589b011a3c0d,0x09966cf5ce4b85ffbe63e0f38b5d889c3c00409215926df7617b9dfdd8376839,0xbfa10e6f666e6236eac47d140172aff89766d68cbaa2f5e3b7a342df23be9b30,0x2d7c1f2d58b65d2c684df07fd4d6b3b0a6588aa6f893d7537e4e1a21eb906f5e,0x91c4c0087eed39b8b75dbf917dd5b926a6c0cf13a182b6d7f46bbc90d87316f6,0xe1a3fdf623dbab05ba05ed8d6a86e5cfb861052877d349ac6dd5e2b6e4c6a3cc,0xa9f9f7b98d111dcb6a66080c2b68195e3d1df62713ddcbbcb83a085501f21f03,0x1fbd7341908fdd5939ef7710c6a9ec72fb8e0462c72199c2f801ef4309c24ef6,0xc11ae24ed78965e832e82626470a84fa0994108ac4d3c3c2bcb366f0c1e20f47,0x687a6e966b3d90a2291b2802eb8a946f021c7cc4102d07e88020bf5cd5621a18,0x9b8f13a8fc57ee3e04db4c14cf051b57efcc52df2b197ef0e2e703fd6587b7ad,0xffba1cbd01cc6b96b1e9cd091bcac94afbe73db627731c51b3c82970131cec9c,0x17703c113f6047745165faaecfff1d4ffb9ded548aa425def53c60bd1b3b885b,0x12beca90efa502f1b7b9034093cbade02ffedae20a4a15cc1224fc14dbcf0f54,0x7e38bde01726f3a0d653c87ec15eec03cdc5e741b234483476d5c7f9cf323070,0x781bbb28f554e7a3f908c60f7e3f5933db0a850e54a28d2dcbdca8a0f1ae7946,0x5a673f8d602ded2a8bed58073289ef8626504cc85f36b9196f9d725081550d02,0x5626dc3da78de1edbd1fe9d806f8a7859dead5e128ee8aaedcda9e08ee4a5681,0x96b0bfff4cd949180712f91200d3fadc7c44936c6410645d0cc1229bf7124b1c
```
