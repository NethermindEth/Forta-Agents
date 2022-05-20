# Health Factors Monitoring Agent

## Description

This agent monitors the health factors of borrowing positions in the UMEE protocol.
The agent's behavior can be customized by editing the configuration fields in `src/agent.config.ts`.

## Supported Chains

- Ethereum

## Alerts

- UMEE-1
  - Fired when a borrowing position health factor is below a defined threshold and its collateral value is above a defined threshold
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata:
    - `address`: lender address
    - `healthFactor`: health factor of the borrow position
    - `totalCollateralUsd`: the value of the position's collateral in USD

## Test Data

### Mainnet

Uncomment the lines indicated in `agent.config.ts` and run:

```
npm run range 14797593..14797595
```

A finding will be emitted when processing block 14797594.
