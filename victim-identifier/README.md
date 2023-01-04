# Victim Identifier Bot

## Description

This bot identifies possible victims during the preparation or the exploitation stage of an attack, using the `VictimIdentifier` library from the [General-Agents-Module](https://github.com/NethermindEth/general-agents-module#victimidentifier)

> The bot uses Luabase, Moralis, Ethplorer and block explorer APIs. In order to increase performance, add your own API keys to the `src/keys.ts` file.

## Supported Chains

- Ethereum
- Optimism
- BNB Smart Chain
- Polygon
- Fantom
- Arbitrum
- Avalanche

## Alerts

- VICTIM-IDENTIFIER-PREPARATION-STAGE

  - Fired when an contract address is identified as a possible victim in the preparation stage of an attack
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains a record of contract address to an object with the following properties:
    - `protocolUrl`: The victim protocol's website address, if found.
    - `protocolTwitter`: The victim protocol's twitter handle, if found.
    - `tag`: The victim protocol's name, if found.
    - `holders`: The token holders of the victim if it is an ERC20 token.
  - Labels contain:
    - `entity`: The victim's address
    - `entityType`: The type of the entity, always set to "Address".
    - `labelType`: The type of the label, always set to "Victim".
    - `confidence`: The confidence level of the contract being a victim (0-1).
    - `customValue`: Not used.

- VICTIM-IDENTIFIER-EXPLOITATION-STAGE

  - Fired when an contract address is identified as a possible victim in the exploitation stage of an attack
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains a record of contract address to an object with the following properties:
    - `protocolUrl`: The victim protocol's website address, if found.
    - `protocolTwitter`: The victim protocol's twitter handle, if found.
    - `tag`: The victim protocol's name, if found.
    - `holders`: The token holders of the victim if it is an ERC20 token.
  - Labels contain:
    - `entity`: The victim's address
    - `entityType`: The type of the entity, always set to "Address".
    - `labelType`: The type of the label, always set to "Victim".
    - `confidence`: The confidence level of the contract being a victim (0-1).
    - `customValue`: Not used.

## Test Data

The bot behaviour can be verified with the following transactions:

On Ethereum:

- [0x05f548db9215621c49d845482f1b804d82697711ef691dd77d2a796f3881bd02](https://etherscan.io/tx/0x05f548db9215621c49d845482f1b804d82697711ef691dd77d2a796f3881bd02) (Olympus DAO Attack - Preparation Stage)
- [0x390def749b71f516d8bf4329a4cb07bb3568a3627c25e607556621182a17f1f9](https://etherscan.io/tx/0x390def749b71f516d8bf4329a4cb07bb3568a3627c25e607556621182a17f1f9) (DFX Finance Attack - Exploitation Stage)

On BNB Smart Chain:

- [0x54121ed538f27ffee2dbb232f9d9be33e39fdaf34adf993e5e019c00f6afd499](https://bscscan.com/tx/0x54121ed538f27ffee2dbb232f9d9be33e39fdaf34adf993e5e019c00f6afd499) (UVToken Attack - Exploitation Stage)
