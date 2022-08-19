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

- [0x6c0dd94fcdf6b6febfbe6f71b55a2857d923feae6c3d29cfa2bf70e50dedd8f1](https://goerli.etherscan.io/tx/0x6c0dd94fcdf6b6febfbe6f71b55a2857d923feae6c3d29cfa2bf70e50dedd8f1) (1 finding - `RootBundleDisputed` was emitted)
- [0x9a16ab7be7465fdf71f3ae190409ac146db13fbfe6554ce38819fcfae14ac384](https://goerli.etherscan.io/tx/0x9a16ab7be7465fdf71f3ae190409ac146db13fbfe6554ce38819fcfae14ac384) (2 findings - `RootBundleDisputed` was emitted 2 times with different parameters) 