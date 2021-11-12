# Yearn Protocol Specific Alerts

## Description

This agent detect two different cases in active maker strategies for Yearn.

- Stability Fee changes for collateral types
- Stale Spot Price in Vat
- OSM Returned Price of Zero

## Supported Chains

- Ethereum

## Alerts

- Yearn-3-1

  - Fired when stability fee changed for collateral types of active maker strategies
  - Severity is always set to "High".
  - Type is always set to "Info".
  - In the metadata you can find:
    - `strategy`: The address of the maker strategy.
    - `collaterealType`: The collateral type of the strategy.

- Yearn-3-2

  - Stale Spot Price detection in Vat - Agent throws alert if poke() function is not called for 3 hours with active makers ilk
  - Severity is always set to "High".
  - Type is always set to "Info".
  - In the metadata you can find:
    - `spot`: Address of the Spot Contract.
    - `strategy`: The address of the strategy.

- Yearn-3-3

  - Fired when OSM returns price of zero and false value which signifies that do not trust returned price.
  - Severity is always set to "Critical".
  - Type is always set to "Suspicious".
  - In the metadata you can find:
    - `OSM`: Address of the Oracle Security module contract.
    - `price`: The returned price.

## Test Data

The test of this agent use a hardhat node forked from mainnet. For running the tests you'll need to create a `.env` file with the following format

```
jsonRPC=<json-rpc-endpoint>
```

In json RPC endpoint you'll need to set an endpoint to a node able to provide state info at block 13546171.
After setting this run the hardhat node using `npm run forked-node` and after that run `npm test`.
