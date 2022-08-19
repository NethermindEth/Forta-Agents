# Relay Dispute Detection bot

## Description

This bot detects relay disputes on the receiving chains for the  [Across v2 Protocol](https://across.to/) - a multichain bridge which uses [UMA](https://umaproject.org/) as its source of on-chain data and validation. For more details refer [here](https://discourse.umaproject.org/t/forta-monitors-across-v2-request-for-proposals/1569).

## Supported Chains
- Mainnet
  
## Alerts

- UMA-3
  - Fired when a dispute occurs on the receiving chain
  - Severity is always set to "medium" 
  - Type is always set to "suspicious"
  - Metadata :
      - `disputer`: the disputer - address which raised a dispute
      - `requestTime` : timestamp of the request made
  
## Test Data

These tests can be run using npm run tx <TX_HASH> :


### Ethereum Mainnet

The agent behaviour can be verified with the following transactions by running `npm run tx <TX_HASH>`:
- [0x10e5c318414dccbc2172ce624afd0a4ae46fa538ef6b21522f2e87991f621e60](https://etherscan.io/tx/0x10e5c318414dccbc2172ce624afd0a4ae46fa538ef6b21522f2e87991f621e60) (1 finding - `RootBundleDisputed` was emitted)
- [0x312985c7e8a363079c3ae416f8e30a3caa4d4ddee61ac9c2c07f2a637655916d](https://etherscan.io/tx/0x312985c7e8a363079c3ae416f8e30a3caa4d4ddee61ac9c2c07f2a637655916d) (2 findings - `RootBundleDisputed` was emitted 2 times with different parameters) 

 ### Goerli Testnet (PoC)

In order to verify the Proof of Concept transactions on Goerli the appropriate `jsonRpcUrl` shall be set in `./forta.config.json`

- [0x92a256ea60afa3a0ef2d65ded22371e32b086f5960be69cf10bd7947cc23f8a2](https://goerli.etherscan.io/tx/0x92a256ea60afa3a0ef2d65ded22371e32b086f5960be69cf10bd7947cc23f8a2) (1 finding - `RootBundleDisputed` was emitted)
- [0xf6ef52f33458eb7af470d589ccb63360cec86fc044401f3b4da0d6587a82d35d](https://goerli.etherscan.io/tx/0xf6ef52f33458eb7af470d589ccb63360cec86fc044401f3b4da0d6587a82d35d) (2 findings - `RootBundleDisputed` was emitted 2 times with different parameters) 