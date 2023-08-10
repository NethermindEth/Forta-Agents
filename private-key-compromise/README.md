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

  - Fired when a receiver address from PKC-1 alert has been inactive for one week.
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

## Test Data

The bot behaviour can be verified with the following command:

On Ethereum:

```
npm run tx 0x8f338a787398fe8925319b60e73f9ba5757a1a72b711e8d05ab081b50260ac7d,0x10136159d5991dd1ab4e444d9db0d4c750760f9ea3201e78d5697f863b9b945e,0x1ce1ca7053f5c330aa7f167f1d4580855051db05d321a1b0f730391a1ebf09d7
```
