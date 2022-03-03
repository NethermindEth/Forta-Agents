# Large Transfers from a Flexa Collateral Manager Partition

## Description

This agent detects large transfers from Flexa Collateral Manager contract partitions.

## Supported Chains

- Ethereum

## Alerts

- FLEXA-2 
    * Fired when it detects `TransferByPartition` events emitted from the `AMP` contract with an amount of large value transferred from a `Flexa Collater Manager` partition.
    * Severity is always set to "Info".
    * Type is always set to "Info".
    * Metadata contains: 
        * `fromPartition`: Address of the partition from which the amount was transferred.
        * `fromAddress`: Address of the user who executed the transfer.
        * `toAddress`: Address of the user who received the transferred amount.
        * `value`: Value of the transferred amount. 
