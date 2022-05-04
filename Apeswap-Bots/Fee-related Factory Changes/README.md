# Apeswap Fee-related factory changes

## Description

This agent detects changes to the `FeeTo` and `FeeToSetter` addresses on `ApeFactory` contract.

## Supported Chains

- BNB Smart Chain
- Polygon

## Alerts

- APESWAP-7-1
  - Fired when the `setFeeTo` function is called on `ApeFactory`.
  - Severity is always set to "Info". 
  - Type is always set to "Info".
  - Metadata contains:
    - `feeTo`: New feeTo address.

- APESWAP-7-2
  - Fired when the `setFeeToSetter` function is called on `ApeFactory`.
  - Severity is always set to "Info". 
  - Type is always set to "Info".
  - Metadata contains:
    - `feeToSetter`: New feeToSetter address.
  
## Test Data

The agent behaviour can be verified with the following transactions on **BSC testnet** (PoC):

- [0x7f0f1f541aa55e7ec0dea67e9d936e8e5bbd7cf1a3d415e39770e573f242e568](https://testnet.bscscan.com/tx/0x7f0f1f541aa55e7ec0dea67e9d936e8e5bbd7cf1a3d415e39770e573f242e568) (`setFeeTo` call)
- [0x4320f1176c82dd0be4499703800b37d41475b56cf0bf9f2418db769a78082bb8](https://testnet.bscscan.com/tx/0x4320f1176c82dd0be4499703800b37d41475b56cf0bf9f2418db769a78082bb8) (`setFeeToSetter` call)
