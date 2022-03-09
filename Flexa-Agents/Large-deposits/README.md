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
    * Amount Threshold is 1M USD.
    * Metadata contains: 
        * `value:BigNumber` The amount of tokens transferred.
        * `fromPartition:string`: The partition the tokens were transfered from.
        * `operator:string`: The address that initiated the transfer.
        * `from:string`: The address the tokens were transferred from.
        * `destinationPartition:string`: The partition the tokens were transferred to.
        * `to:string`: The address the tokens were transferred to.
        * `operatorData`: Information attached to the transfer, by the operator
