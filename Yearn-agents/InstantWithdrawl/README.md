# Instant Withdraw Agent

## Description

To detect vaults that do not allow to withdraw a certain amount of funds and having a more precise idea of vault liquidity. Tris requires simulations where say we take holders that make up X% of vault assets and force them to withdraw their shares to see if the operation is doable in current conditions. DOes not need to be exact, but in the direction of "top 3 holders make 50% of the vault and can withdraw their funds" or "holder with 10% of vault assets cannot withdraw."

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- Year-agent-7
  - Fired when an account isn't able to withdraw.
  - Severity is always set to "info"
  - Type is always set to "Unknown"
  - metadata - gives the balance information of the target address
