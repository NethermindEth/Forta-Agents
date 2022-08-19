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
- TO_BE_ADDED

 ### Goerli Testnet (PoC)

In order to verify the Proof of Concept transactions on Goerli the appropriate `jsonRpcUrl` shall be set in `./forta.config.json`

- [0x775ba67916f31d3548d5d058ee5d452b6fad5d613fbd043829aa30a5e377e47d](https://goerli.etherscan.io/tx/0x775ba67916f31d3548d5d058ee5d452b6fad5d613fbd043829aa30a5e377e47d) (1 finding - `RootBundleDisputed` was emitted)
- [0xa67afdcf26ad16e1f37a2849bc561263d3b83ea1b6ca86b1500784a56c8a4246](https://goerli.etherscan.io/tx/0xa67afdcf26ad16e1f37a2849bc561263d3b83ea1b6ca86b1500784a56c8a4246) (2 findings - `RootBundleDisputed` was emitted 2 times with different parameters) 