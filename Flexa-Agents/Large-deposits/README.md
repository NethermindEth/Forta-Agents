# Large Transfer to Flexa Collateral Manager Partition Agent

## Description

This agent detects large deposits to `FlexaCollateralManager` contract partitions.

## Supported Chains

- Ethereum

## Alerts

- FLEXA-2 
    * Fired when it detects `TransferByPartition` events emitted from the `AMP` contract with a large amount transferred to a `FlexaCollaterManager` partition.
    * Severity is always set to "Info".
    * Type is always set to "Info".
    * Metadata contains: 
        * `amountThreshold`: Threshold of 1M USD.
        * `value`: The amount of tokens transferred.
        * `fromPartition`: The partition the tokens were transfered from.
        * `operator`: The address that initiated the transfer.
        * `from`: The address the tokens were transferred from.
        * `destinationPartition`: The partition the tokens were transferred to.
        * `to`: The address the tokens were transferred to.