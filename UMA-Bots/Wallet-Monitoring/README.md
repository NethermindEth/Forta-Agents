# Relay Dispute Detection bot

## Description

This bot monitors for specific wallets (from a configurable list) that may use the [Across v2 bridge](https://across.to/). a multichain bridge which uses [UMA](https://umaproject.org/) as its source of on-chain data and validation. For more details refer [here](https://discourse.umaproject.org/t/forta-monitors-across-v2-request-for-proposals/1569).


## Supported Chains
- Mainnet
  
## Alerts

- UMA-10
  - Fired when a dispute occurs on the receiving chain
  - Severity is always set to "low" 
  - Type is always set to "suspicious"
  - Metadata :
      - `disputer`: the disputer - address which raised a dispute
      - `requestTime` : timestamp of the request made
  
## Test Data

The bot behaviour can be verified with the following transactions by running `npm run tx <TX_HASH>`:

### Ethereum Mainnet
<!-- - [0x10e5c318414dccbc2172ce624afd0a4ae46fa538ef6b21522f2e87991f621e60](https://etherscan.io/tx/0x10e5c318414dccbc2172ce624afd0a4ae46fa538ef6b21522f2e87991f621e60) (1 finding - `RootBundleDisputed` was emitted)
- [0x312985c7e8a363079c3ae416f8e30a3caa4d4ddee61ac9c2c07f2a637655916d](https://etherscan.io/tx/0x312985c7e8a363079c3ae416f8e30a3caa4d4ddee61ac9c2c07f2a637655916d) (1 finding - `RootBundleDisputed` was emitted)  -->

 ### Goerli Testnet (PoC)

In order to verify the Proof of Concept transactions on Goerli the appropriate `jsonRpcUrl` shall be set in `./forta.config.json`

- [0x60554718bc26a87654d02e731c4fa8a5cc5929f90fd40ae8e30cfad23fadfb36 ](https://goerli.etherscan.io/tx/0x60554718bc26a87654d02e731c4fa8a5cc5929f90fd40ae8e30cfad23fadfb36 ) (1 finding - `FilledRelay` was emitted with a monitored wallet as depositor)
- [0x56820f1d68fe262bb1a17e4fa40218a686357d2d495002a59557239f995cc341](https://goerli.etherscan.io/tx/0x56820f1d68fe262bb1a17e4fa40218a686357d2d495002a59557239f995cc341) (0 findings - `FilledRelay` was emitted with a non-monitored wallet as depositor) 