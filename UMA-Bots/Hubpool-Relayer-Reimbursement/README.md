# Relayer token reimbursement detection bot 

## Description

This bot detects transfers of funds from the HubPool, which is the L1 liquidity pool, to spoke pools for relayer reimbursement for the  [Across v2 Protocol](https://across.to/) - a multichain bridge which uses [UMA](https://umaproject.org/) as its source of on-chain data and validation. For more details refer [here](https://discourse.umaproject.org/t/forta-monitors-across-v2-request-for-proposals/1569).


## Supported Chains
- Ethereum

## Alerts

- UMA-4
  - Fired when a transfer of funds for relayer reimbursement takes place
  - Severity is always set to "low" 
  - Type is always set to "info"
  - Metadata :
      - `l1Token`: address of the token on L1
      - `receivingToken` : address of the receiving token
      - `amount`: amount of ERC20 tokens transferred
      - `to` : address to which the l2 tokens are transferred (generally owned by the relayer)
      - `chainName` : the funds are transferred to the `spokePool` on `chainName` chain
  
## Test Data

These tests can be run using npm run tx <TX_HASH> :

### Ethereum Mainnet
- [0x43828aac2fdcc17445bafc75992a4eb5c856b0babe87b69b08f4e53bb6c0db9c](https://etherscan.io/tx/0x43828aac2fdcc17445bafc75992a4eb5c856b0babe87b69b08f4e53bb6c0db9c) (3 findings - `TokensRelayed` was emitted 3 times with different parameters)
- [0x2a65c46484b7e7ef3a2d96852dee5db14e580ba074eeaa52718d1eaa572af621](https://etherscan.io/tx/0x2a65c46484b7e7ef3a2d96852dee5db14e580ba074eeaa52718d1eaa572af621) (5 findings - `TokensRelayed` was emitted 5 times with different parameters)

### Goerli Testnet (PoC)

> The PoC files are available at `./PoC/`

In order to verify the Proof of Concept transactions on Goerli the appropriate `jsonRpcUrl` shall be set in `./forta.config.json`

- [0x5e3f0862a2e797ae39cb10d42bdc49682ced1e48aa3de21712aa0fa6d06f5f77](https://goerli.etherscan.io/tx/0x5e3f0862a2e797ae39cb10d42bdc49682ced1e48aa3de21712aa0fa6d06f5f77) (1 finding - `TokensRelayed` was emitted)
- [0x6747094c78269b9e587ff486b583d889baf2e22f1b14fc7596b9efefb504fe45](https://goerli.etherscan.io/tx/0x6747094c78269b9e587ff486b583d889baf2e22f1b14fc7596b9efefb504fe45) (2 findings - `TokensRelayed` was emitted 2 times with different parameters)