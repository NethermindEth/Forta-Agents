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
    - `role`: role that has been revoked..
    - `account`: the account that has been granted the role.
    - `sender`: the account that originated the contract call.

## Test Data
> Note: Bot has to be tested with the Kovan testnet, otherwise it will fail with this test data.

The bot behavior can be verified with the following contracts on the Kovan ETH testnet:

[0x45f35efd4555Ea1443BF19439761066EF7e18dC1](https://kovan.etherscan.io/address/0x45f35efd4555Ea1443BF19439761066EF7e18dC1) - `TestProxy`.

[0x6BCf8c28ADC724896b04e78cdd35BD2ee8B70a13](https://kovan.etherscan.io/address/0x6bcf8c28adc724896b04e78cdd35bd2ee8b70a13) - `TestImplementation`.

To test specific event emissions, use the following transactions on the Kovan ETH testnet:

[0xbff767a1d166c407da4b8fd4e4ecedf1942ace4b08dff03cd5bde8f208c99382](https://kovan.etherscan.io/tx/0xbff767a1d166c407da4b8fd4e4ecedf1942ace4b08dff03cd5bde8f208c99382) - `RoleAdminChanged` event.

[0xf4c0cbca61828433579e2fd7ab29581909ac457f9cfbfd0959bf90cfa2dce71e](https://kovan.etherscan.io/tx/0xf4c0cbca61828433579e2fd7ab29581909ac457f9cfbfd0959bf90cfa2dce71e) - `RoleGranted` event.

[0xc1cffb30a38bc046e2c3762cc5dcba9dd20c69a54f6bec314a410a86e9b4b7be](https://kovan.etherscan.io/tx/0xc1cffb30a38bc046e2c3762cc5dcba9dd20c69a54f6bec314a410a86e9b4b7be) - `RoleRevoked` event.