# Deploy MetaPool agent

## Description

This agent detects `MetaPoolDeployed` event emissions from the `Factory` Contract.

## Supported Chains

- Ethereum

## Alerts

- CURVE-9
  - Fired when `MetaPoolDeployed` event is emitted
  - Severity is always set to "info"
  - Type is always set to "unknown"
  - Metadata contains:
    - `coin`: Address of the coin being used in the metapool
    - `basePool`: Address of the base pool to use within the metapool
    - `a`: Amplification co-efficient
    - `fee`: Trade fee
    - `deployer`: Address that called the `deploy_metapool` function

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x85cb8fc9e6bf808bd2e718e44c4fbc020002e2920773f20f715cf2c2c4b6d1b6 (contains`MetaPoolDeployed` event emission)