# Yearn Vault Management Changes

## Description

This agent detect multiple management actions in Yearn Vaults. It detects:
- UpdatedManagement event.
- UpdatedManagementFee event.
- UpdatedPerformanceFee event.

## Supported Chains

- Ethereum

## Alerts

- Yearn-9-1
  - Fired when the event `UpdatedManagement` is emited from a Yearn Vault.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - In the metadata you can find:
    - `vaultAddress`: Address of the Yearn Vault emiting the event.
    - `setManagement`: Address set as management.

- Yearn-9-2
  - Fired when the event `setManagementFee` is emited from a Yearn Vault.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - In the metadata you can find:
    - `vaultAddress`: Address of the Yearn Vault emiting the event.
    - `setFee`: The new fee set.

- Yearn-9-3
  - Fired when the event `setPerformanceFee` is emited from a Yearn Vault.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - In the metadata you can find:
    - `vaultAddress`: Address of the Yearn Vault emiting the event.
    - `setFee`: The new fee set.

- Yearn-9-4
  - Fired when the event `StrategyAdded` is emited from a Yearn Vault.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - In the metadata you can find:
    - `vaultAddress`: Address of the Yearn Vault emiting the event.
    - `strategyAdded`: The new fee set.

## Test Data

The test of this agent use a hardhat node forked from mainnet. For running the tests you'll need to create a `.env` file with the following format
```
jsonRPC=<json-rpc-endpoint>
```
In json RPC endpoint you'll need to set an endpoint to a node able to provide state info at block 13546171.
After setting this run the hardhat node using `npm run forked-node` and after that run `npm test`.
