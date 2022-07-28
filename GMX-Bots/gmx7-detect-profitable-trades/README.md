# Frontrun

## Description

This bot detects accounts using GMX that have an unusual amount of profitable swaps. By default this is 90% but it can be set by `PROFIT_RATIO` variable in `src/agent.config.ts`.

## Supported Chains

- Arbitrum
- Avalanche

## Alerts

- GMX-07
  - Fired when an account using GMX has an unusual amount of profitable trades
  - Severity is always set to "Suspicious"
  - Type is always set to "Medium"
  - Metadata included:
    - `account`: Address of the account with the unusual amount of profitable trades
    - `profitableTrades`: Number of profitable trades
    - `totalTrades`: Number of total trades
    - `totalProfit`: Total profit of the account, calculated from previous trades (in USD).

## Changing Profitable Trades Ratio & Grace Period
By default this ratio is set to trigger the bot when an account has more than 90% of profitable trades. This ratio can be changed in the `utils.ts` file. Similarly, the grace period is set by default to 5 trades, but can be changed in the `utils.ts` file.

## Test Data

The bot behaviour can be verified with the following transactions:

- Currently no transactions have been found
