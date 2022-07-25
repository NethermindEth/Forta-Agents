# Pools Drained Bot

## Description

This bot tries to detect Uniswap V2/V3 pools being drained. It accomplishes this by detecting when a Uniswap pool transaction contains an amount of token transfers greater than the expected amount of transfers. The expected amount is derived from the interactions executed within the pool.

## Supported Chains

- Ethereum
- Optimism
- Arbitrum
- Polygon
- All testnets related to the above chains
  
> Note that Uniswap V2 is only deployed on Ethereum mainnet/testnets. The bot will work 
> on other networks but will never return a finding if the Uniswap factories on that 
> network doesn't correspond to the ones used in the bot.
> V2 Factory: 0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f
> V3 Factory: 0x1f98431c8ad98523631ae4a59f267346ea31f984

## Alerts

- NETHFORTA-UNI
  - Fired when a transaction contains an amount of token transfers that are greater than expected. (See "Description" for more info)
  - Severity is always set to "Critical"
  - Type is always set to "Suspicious"
  - Metadata contains
    - `pairs`: The list of pools that migh have been drained in the transaction.

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x81e9918e248d14d78ff7b697355fd9f456c6d7881486ed14fdfb69db16631154 (USDT-TCR drained)
