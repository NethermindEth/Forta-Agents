# Nafta NFT operations monitor

## Description

This agent detects transactions where `AddNFT`, `EditNFT` & `RemoveNFT` NAFTA's events are emitted.

## Supported Chains

- Ethereum

## Alerts

- NAFTA-OP-1
  - Fired when `AddNFT` is emitted
  - Severity is always set to "info" 
  - Type is always set to "info"
  - The metadada contains:
    - `nft`: The address of the new listed NFT.
    - `id`: The id of the new listed NFT.
    - `sender`: The address of the account that added the NFT.
    - `flashFee`: Flashloans price.
    - `longtermFee`: Longterm rent price.
    - `maxBlocks`: Maximum amount of blocks allowed in a rent.
    - `lenderNFT`: Id of the NFT the lender receive.

- NAFTA-OP-2
  - Fired when `EditNFT` is emitted
  - Severity is always set to "info" 
  - Type is always set to "info"
  - The metadada contains:
    - `nft`: The address of the NFT edited.
    - `id`: The id of the NFT edited.
    - `sender`: The address of the account that edited the NFT.
    - `flashFee`: The new flashloans price.
    - `longtermFee`: The new longterm rent price.
    - `maxBlocks`: The new  maximum amount of blocks allowed in a rent.
    - `lenderNFT`: Id of the asocciated lender's NFT.

- NAFTA-OP-3
  - Fired when `RemoveNFT` is emitted
  - Severity is always set to "info" 
  - Type is always set to "info"
  - The metadada contains:
    - `nft`: The address of the NFT removed.
    - `id`: The id of the NFT removed.
    - `sender`: The address of the account that edited the NFT.
    - `lenderNFT`: Id of the asocciated lender's NFT.
    
## Test Data

The agent behaviour can be verified with the following transactions:

- 0x47ca46682fb25360dedce2980df2249be4b842c25acadd0667af1008cd73fabe (First NFT added)
