# Role Changes Monitor Bot

## Description

This bot detects changes in roles in both the Safety Module and Liquidity Module contracts.

## Supported Chains

- Ethereum

## Alerts

- DYDX-18-1
  - Fired when a `RoleAdminChanged` event has been fired from either the Safety or Liquidity Module.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `role`: role that has changed.
    - `previousAdminRole`: admin role for `role` before being replaced.
    - `newAdminRole`: new admin role for `role` that replaced `previousadminRole`.

- DYDX-18-2
  - Fired when a `RoleGranted` event has been fired from either the Safety or Liquidity Module.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `role`: role that has been granted.
    - `account`: the account that has been granted the role.
    - `sender`: the account that originated the contract call.

- DYDX-18-3
  - Fired when a `RoleRevoked` event has been fired from either the Safety or Liquidity Module.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `role`: role that has been revoked.
    - `account`: the account that has been granted the role.
    - `sender`: the account that originated the contract call.

## Test Data

### Mainnet
The bot behavior can be verified with the following transactions on mainnet Ethereum:

- [0xd0609f2a45bc00da0de1e5f47c2e7a625ad25ca50011ecf143706cfc16e0b5ee](https://etherscan.io/tx/0xd0609f2a45bc00da0de1e5f47c2e7a625ad25ca50011ecf143706cfc16e0b5ee) - `RoleGranted` event.
- [0xa07da3a1bb83f82086c87348955904d01dbe98f99ef32823be6d711675a0d5c7](https://etherscan.io/tx/0xa07da3a1bb83f82086c87348955904d01dbe98f99ef32823be6d711675a0d5c7) - `RoleRevoked` event.
- [0x208a8221ff67f3c8c0d5e108c1e3291bce012462ba879d430bf355ad583d2c1f](https://etherscan.io/tx/0x208a8221ff67f3c8c0d5e108c1e3291bce012462ba879d430bf355ad583d2c1f) - `RoleAdminChanged` and `RoleGranted` events (multiple of each).

### Kovan Testnet
The bot behavior can be verified with the following contracts on the Kovan ETH testnet:

[0x45f35efd4555Ea1443BF19439761066EF7e18dC1](https://kovan.etherscan.io/address/0x45f35efd4555Ea1443BF19439761066EF7e18dC1) - `TestProxy`.

[0x6BCf8c28ADC724896b04e78cdd35BD2ee8B70a13](https://kovan.etherscan.io/address/0x6bcf8c28adc724896b04e78cdd35bd2ee8b70a13) - `TestImplementation`.

To test specific event emissions, use the following transactions on the Kovan ETH testnet:

[0xec9209a1305870e2335fd392c569a975ffaebf95563ee67a0522fd53907e2683](https://kovan.etherscan.io/tx/0xec9209a1305870e2335fd392c569a975ffaebf95563ee67a0522fd53907e2683) - `RoleAdminChanged` event.

[0x4ce7c3f0782be106e59d84b503facac93ac8fd32ba002b95cfeea34de8fc102c](https://kovan.etherscan.io/tx/0x4ce7c3f0782be106e59d84b503facac93ac8fd32ba002b95cfeea34de8fc102c) - `RoleGranted` event.

[0xd8d65d66dc2c277a51928ec13508ca781843826f5848e0fdbc8f3f5eefcc09ac](https://kovan.etherscan.io/tx/0xd8d65d66dc2c277a51928ec13508ca781843826f5848e0fdbc8f3f5eefcc09ac) - `RoleRevoked` event.