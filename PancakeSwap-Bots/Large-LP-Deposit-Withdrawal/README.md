# Large Liquidity Pool Deposits/Withdrawals 

## Description

This bot detects large addition/removal of liquidity in PancakeSwap pools


## Supported Chains

- Binance Smart Chain 

## Alerts

- CAKE-3-1
  - Fired when there's large deposit into a liquidity pool 
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata:
    - `poolAddress`: The address of the liquidity pool 
    - `token0`: The address of token0
    - `amount0`: The deposited amount of token0
    - `token1`: The address of token1
    - `amount1`: The deposited amount of token1
    - `totalSupply`: The total supply of the pool before the deposit transaction at the preceeding block
    


- CAKE-3-1
  - Fired when there's large withdrawal from a liquidity pool 
  - Severity is always set to "Medium"
  - Type is always set to "Suspicious"
  - Metadata:
    - `poolAddress`: The address of the liquidity pool 
    - `token0`: The address of token0
    - `token1`: The address of token1
    - `amount0`: The withdrawn amount of token0
    - `amount1`: The withdrawn amount of token1
    - `totalSupply`: The total supply of the pool before the deposit transaction at the preceeding block
    
## Test Data

The agent behaviour can be verified with the following transactions:
- [0xc850b85d120645ab9fb30e1bf29e972f6f65a491d307b01bb516b3df257c74af](https://bscscan.com/tx/0xc850b85d120645ab9fb30e1bf29e972f6f65a491d307b01bb516b3df257c74af) - 
`Binance Smart Chain` - Large LP Deposit 
- [0xdfa06befcd04565b03359dfbf8d6cc9bbcfb1d7a2051f54834bb934716f54bb8](https://bscscan.com/tx/0xdfa06befcd04565b03359dfbf8d6cc9bbcfb1d7a2051f54834bb934716f54bb8) - 
`Binance Smart Chain` - Large LP Withdrawal



