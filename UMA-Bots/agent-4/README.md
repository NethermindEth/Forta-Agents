# Forta bot deployement bot

## Description

This bot detects transfers of funds from the HubPool, which is the L1 liquidity pool, to spoke pools for relayer reimbursement for the  [Across v2 Protocol](https://across.to/) - a multichain bridge which uses [UMA](https://umaproject.org/) as its source of on-chain data and validation. For more details refer [here](https://discourse.umaproject.org/t/forta-monitors-across-v2-request-for-proposals/1569).


## Supported Chains
- Mainnet
  
## Alerts

- UMA-REIMB
  - Fired when a transfer of funds for relayer reimbursement takes place
  - Severity is always set to "low" 
  - Type is always set to "info"
  - Metadata :
      - `l1Token`: address of the token on L1
      - `l2Token` : address of the token on L2
      - `amount`: amount of ERC20 tokens transferred
      - `to` : address to which the l2 tokens are transferred (generally owned by the relayer)
      - `chainName` : the funds are transferred to the `spokePool` on `chainName` chain
  
## Test Data
Txn:
- 0x43828aac2fdcc17445bafc75992a4eb5c856b0babe87b69b08f4e53bb6c0db9c
- 0x2a65c46484b7e7ef3a2d96852dee5db14e580ba074eeaa52718d1eaa572af621