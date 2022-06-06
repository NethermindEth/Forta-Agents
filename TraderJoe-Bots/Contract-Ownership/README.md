# Ownership Transfer Monitor Bot

## Description

This bot detects transfers in ownership in both the following monitored contracts:
- sJOE Staking
- veJOE Staking
- veJOE Token
- MasterChefJoeV2
- MasterChefJoeV3
- BoostedMasterChefJoe
- 2nd Team Vesting
- RocketJoeToken
- RocketJoeStaking
- RocketJoeFactory

## Supported Chains

- Avalanche

## Alerts

- TRADERJOE-24
  - Fired when a `OwnershipTransferred` event has been fired from any of the monitored contracts.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `previousOwner`: Previous address that served as the contract owner.
    - `newOwner`: New address that serves as the contract owner.

## Test Data

### Mainnet
The bot behavior can be verified with the following transactions on mainnet Ethereum:

- [0xd0609f2a45bc00da0de1e5f47c2e7a625ad25ca50011ecf143706cfc16e0b5ee](https://etherscan.io/tx/0xd0609f2a45bc00da0de1e5f47c2e7a625ad25ca50011ecf143706cfc16e0b5ee) - `RoleGranted` event.

### Kovan Testnet
The bot behavior can be verified with the following contracts on the Kovan ETH testnet:

[0xEE4A7FB21A5A66544cd82275A7D8D92Bb9F7Db9C](https://kovan.etherscan.io/address/0xee4a7fb21a5a66544cd82275a7d8d92bb9f7db9c) - `TestMonitoredContract`.

To test for the event emission, use the following transaction on the Kovan ETH testnet:

[0x1aa161094361ecd822bd510f78b85ef1c3045322b8ee7a450389951b61f10ab4](https://kovan.etherscan.io/tx/0x1aa161094361ecd822bd510f78b85ef1c3045322b8ee7a450389951b61f10ab4) - `OwnershiptTransferred` event.