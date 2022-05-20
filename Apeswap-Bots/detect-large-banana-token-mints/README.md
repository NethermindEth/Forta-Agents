# Large BANANA Token Mint

## Description

This bot detects transactions with large BANANA token mints

## Supported Chains

- Binance Smart Chain
- Polygon


## Alerts

Describe each of the type of alerts fired by this agent

- APESWAP-1
  - Fired when a transaction contains a BANANA token mint equals to or greater than half of BANANA token's total supply
  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata contains the following field: 
    - `from`: the address of the initiator of the transaction
    - `to`: BANANA token contract address
    - `value`: the minted amount of BANANA tokens

## Test Data

The agent behaviour can be verified with the following transactions:

- [https://www.bscscan.com/tx/0x63b996196eaff9bc14983fd9c4fcf9b6d64762b499bd1a78346045291f4535e9](https://www.bscscan.com/tx/0x63b996196eaff9bc14983fd9c4fcf9b6d64762b499bd1a78346045291f4535e9)  `Binance Smart Chain Mainnet` - 
bot can be configured to detect the `25000` BANANA tokens minted by this [transaction](https://www.bscscan.com/tx/0x63b996196eaff9bc14983fd9c4fcf9b6d64762b499bd1a78346045291f4535e9) by modifying agent detection logic in `agent.ts L44` thus:
```
 if (mintAmount.gte(threshold)) {
    findings.push(createFinding(botMetaData));
  }
```

- [0x16a4c5bfaae3669b1d45e61726d5fdfdfbec91ac7822b78d6a70db48d4a7ff40](https://testnet.bscscan.com/tx/0x16a4c5bfaae3669b1d45e61726d5fdfdfbec91ac7822b78d6a70db48d4a7ff40) `PoC Binance Smart Chain Testnet` 

