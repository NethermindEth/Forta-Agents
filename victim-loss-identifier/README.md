# 🤖 Victim & Loss Identifier Bot

## ℹ️ Description

This bot is designed to identify victims of end-user attacks and calculate their losses. Its functionality revolves around monitoring alerts from the [Scam Detector Feed](https://app.forta.network/bot/0x1d646c4045189991fdfd24a66b192a294158b839a6ec121d740474bdacb3ab23) bot. When it receives an alert, the bot extracts information related to the scammer's addresses and threat category. Subsequently, it provides answers to questions about who the victims of the scammer are and what digital assets have been transferred from these victims to the scammer.

To accomplish this, the bot accesses historical data related to the scammer, going back 90 days (a configurable value). It then quantifies each digital asset by converting its value into USD.

The bot continues its assessment of victims and losses on a daily basis, with the time interval being configurable, starting from the moment it first received an alert from the Scam Detector Feed. This assessment continues for 30 days after the last known activity of the scammer.

## 🌐 Supported Chains

- Ethereum

## 🔗 Alert Mapping

<table>
  <tr>
    <th>Underlying Bot's Name</th>
    <th>Underlying Bot's Alert ID</th>
    <th>Victim & Loss Identifier's Alert ID</th>
  </tr>
  <tr>
    <td>Scam Detector Feed</td>
    <td>SCAM-DETECTOR-FRAUDULENT-NFT-ORDER</td>
    <td>VICTIM-LOSS-INFORMATION-FRAUDULENT-NFT-ORDER</td>
  </tr>
</table>

## 🚨 Alerts

### VICTIM-LOSS-INFORMATION

- **Description**: Fired when an end-user attack victim and their losses are identified.
- **Severity**: Info
- **Type**: Info
- **Addressess**: An array containing the victim's address and the scammer's address.

**Metadata**:

- `start_timestamp`: The timestamp marking the beginning of the assessment period
- `end_timestamp`: The timestamp marking the conclusion of the assessment period
- `scam_detector_alert_id`: The alert ID from Scam Detector
- `victim_address`: The victim's address
- `tx_hash`: The exploit transaction hash
- `usd_lost`: Total USD lost by the victim up to the point of the alert
- `usd_lost_to_scammer: Total amount in USD lost by the victim specifically to the scammer involved in the transaction up to the point of the alert.
- `erc_721_usd_lost`: Total USD lost in ERC-721 tokens up to the point of the alert
- `erc_721_lost`: Details of the ERC-721 tokens lost
  - `name`: Name of the token
  - `contract`: Contract address
  - `token_id`: Token ID
  - `value USD`: USD value lost on this token

**Labels**:

1. Victim
   - `entity`: The victim address
   - `entityType`: Address
   - `label`: Victim
   - `confidence`: 0.7
2. NFT
   - `entity`: The stolen NFT ID and the NFT's contract address
   - `entityType`: Address
   - `label`: NFT
   - `confidence`: 0.7
3. Exploit
   - `entity`: The transaction's hash
   - `entityType`: Transaction
   - `label`: Exploit
   - `confidence`: 0.7

### VICTIM-LOSS-INFORMATION-FALSE-POSITIVE

- **Description**: Fired when an address that was previously identified as a scammer is likely not associated with a scam. This emits False Positive (FP) labels.
- **Severity**: Low
- **Type**: Info

**Metadata**: None

**Labels**:

1. Benign
   - `entity`: The address previously identified as a scammer but now considered benign
   - `entityType`: Address
   - `label`: Benign
   - `confidence`: 0.7
   - `remove`: false
2. Victim
   - `entity`: Addresses that were previously labeled as victims but are now removed due to the false positive
   - `entityType`: Address
   - `label`: Victim
   - `confidence`: 0.7
   - `remove`: true
3. NFT
   - `entity`: ERC-721 token IDs previously associated with the false positive address
   - `entityType`: Address
   - `label`: NFT
   - `confidence`: 0.7
   - `remove`: true
4. Exploit
   - `entity`: Exploit transaction hashes previously associated with the false positive address
   - `entityType`: Transaction
   - `label`: Exploit
   - `confidence`: 0.7
   - `remove`: true

## 📊 Data Sources

- Zettablock (ERC721 Transfer events)
- DefiLlama (ETH price)
- Alchemy (NFT collection floor price)

## 🧪 Test Data

To verify the bot's behavior, you'll need to meet the following prerequisites.

1. [Generate a Forta API Key](https://docs.forta.network/en/latest/api-reference/#generating-api-keys) and then create a `forta.config.json` in the root directory of the bot like this:

```json
{
  "fortaApiKey": "Your-Forta-API-Key"
}
```

2. Acquire a [Zettablock](https://www.zettablock.com/) API key and an [Alchemy](https://www.alchemy.com/) API key and then create a `secrets.json` in the root directory of the bot like this:

```json
{
  "generalApiKeys": {
    "ZETTABLOCK": ["Your-Zettablock-API-Key"]
  },
  "apiKeys": {
    "victimLoss": {
      "alchemyApiKey": "Your-Alchemy-API-Key"
    }
  }
}
```

You can verify the bot's behavior by following these steps:

1. Install the required dependencies:

```
npm install
```

2. Run the bot for a specific underyling bot's alert, like this:

```
npm run alert 0x98513fc3790aed850af40293cedb2cd567a25234c4c31e9ba4d31947c77e070e
```

The example alert is for the following transaction:

- [0xb5c5c79e33831f5686572d2c4877542da22c0f9f5be529267c60cba77bb72ba8](https://etherscan.io/tx/0xb5c5c79e33831f5686572d2c4877542da22c0f9f5be529267c60cba77bb72ba8) (VICTIM-LOSS-INFORMATION)

Screenshot of the findings after running the command:

<img src="https://raw.githubusercontent.com/NethermindEth/Forta-Agents/972687193977affaee93ed98a6e08b4d6c727b81/victim-loss-identifier/assets/alert-findings.png" width="1134" height="741">

## 📜 License

The bot is released under the [Forta Bot License](https://github.com/NethermindEth/Forta-Agents/victim-loss-identifier/blob/main/LICENSE.md).

## <img src="https://nethermind.io/wp-content/uploads/2023/07/logo-icon.svg" width="37.5" height="18.75"> About Us

Nethermind is a blockchain research and software engineering company empowering enterprises and developers worldwide to work with and build on decentralized networks. We are a leading contributor to critical infrastructure and developer tooling for blockchain ecosystems, focused on upholding the core ethos of decentralization and security. The Nethermind execution layer client plays an important role in advancing the network, and we actively collaborate with the broader Ethereum community. Furthering Ethereum scalability through Starknet, we deliver infrastructure and developer resources, including a node implementation and a block explorer and data analytics platform.
