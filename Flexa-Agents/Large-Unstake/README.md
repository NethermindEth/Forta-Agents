# Large Transfer from a Flexa Collateral Manager Partition Agent

## Description

This agent detects large transfers from `FlexaCollateralManager` contract partitions.

## Supported Chains

- Ethereum

## Alerts

- FLEXA-2 
    * Fired when it detects `TransferByPartition` events emitted from the `AMP` contract with a large amount transferred from a `Flexa Collater Manager` partition.
    * Severity is always set to "Info".
    * Type is always set to "Info".
    * Metadata contains: 
        * `fromPartition`: Partition the tokens were transferred from.
        * `operator`: Address that initiated the transfer.
        * `fromAddress`: Address the tokens were transferred from.
        * `toAddress`: Address the tokens were transferred to.
        * `value`: Amount of tokens transferred. 
