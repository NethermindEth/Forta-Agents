# Apeswap Role Change Detection Bot

## Description

This bot detects role (Owner/Admin/Dev) changes in Apeswap's `MasterApe` and `MasterApeAdmin` contracts (BSC) and ownership transfers in `MiniApeV2` and `MiniComplexRewarderTime` (Polygon).

## Supported Chains

- BNB Smart Chain
- Polygon

## Alerts

- APESWAP-10-1

  - Fired when the ownership is **renounced** in either `MasterApe`, `MasterApeAdmin`, `MiniApeV2` or `MiniComplexRewarderTime` contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:    
    - `previousOwner`: Previous owner address.
    - `newOwner`: Null address.

- APESWAP-10-2
  
  - Fired when the ownership is **transferred** in either `MasterApe` or `MasterApeAdmin`, `MiniApeV2` or `MiniComplexRewarderTime` contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `previousOwner`: Previous owner address.
    - `newOwner`: New owner address.

- APESWAP-10-3
  
  - Fired when `TransferredFarmAdmin` event is emitted from `MasterApeAdmin` contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `previousFarmAdmin`: Previous farm admin address.
    - `newFarmAdmin`: New farm admin address.    

- APESWAP-10-4
  
  - Fired when `dev` function is called on `MasterApe` contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `newDevAddress`: New dev address.
    
## Test Data

The bot behaviour can be verified with the following transactions on **BSC testnet** (PoC):
- [0xef3949f07676b3443fc863deb214b3e2bc5bfbb10feaae8bf99fc27b531ef9f7](https://testnet.bscscan.com/tx/0xef3949f07676b3443fc863deb214b3e2bc5bfbb10feaae8bf99fc27b531ef9f7) 
- [0x1fdbdcdace68778c14ca5e7f6e2551e07a2cd71bc53d345ad240be55ed08b1b4](https://testnet.bscscan.com/tx/0x1fdbdcdace68778c14ca5e7f6e2551e07a2cd71bc53d345ad240be55ed08b1b4)

And with this on **Polygon Mainnet**:
- [0xf580a9d180f30f295bd539d1d0c01a5cd0e09c80c9e4a7d1fe4bd97082b9ee6a](https://polygonscan.com/tx/0xef3949f07676b3443fc863deb214b3e2bc5bfbb10feaae8bf99fc27b531ef9f7) 
