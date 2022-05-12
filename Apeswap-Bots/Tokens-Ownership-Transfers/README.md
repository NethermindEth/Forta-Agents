# BANANA/GNANA Ownership Changes Detection Bot

## Description

This agent detects `OwnershipTransferred` event emissions from BANANA/GNANA token contracts on BSC and `LogChangeMPCOwner` event emissions from BANANA token contract on Polygon.

## Supported Chains

- BNB Smart Chain
- Polygon

## Alerts

- APESWAP-6-1
  - Fired when ownership is renounced on BANANA/GNANA token contract
  - Severity is always set to "Info".
  - Type is always set to "Info" .
  - Metadata contains:
    - BSC:
      - `previousOwner`: Address of the previous owner.
      - `newOwner`: Address of the new owner.
    - Polygon:
      - `oldOwner`: Address of the old MPC owner.
      - `newOwner`: Address of the new MPC owner.
  

## Test Data

The bot behaviour can be verified with the following transactions on **BSC Testnet** (PoC):
- [0x1e8380dc0471eb8d1c894189e2aebf2f027fcf426cd5606fbc25b37844242aa1](https://bscscan.com/tx/0x1e8380dc0471eb8d1c894189e2aebf2f027fcf426cd5606fbc25b37844242aa1) (GNANA - Ownership transferred)
- [0xbfe7a3ddd2309ba58ad904faf798d508ebf9e935f1511fbb9ae78c833de8bfa4](https://bscscan.com/tx/0xbfe7a3ddd2309ba58ad904faf798d508ebf9e935f1511fbb9ae78c833de8bfa4) (BANANA - Ownership renounced)

And with the following transaction on **Mumbai Testnet** (PoC):
- [0x4dda075a5b0cbf43f35059819c985e42263793c2ebb877b171d8eaa8ddbc6d12](https://mumbai.polygonscan.com/tx/0x4dda075a5b0cbf43f35059819c985e42263793c2ebb877b171d8eaa8ddbc6d12) (BANANA - MPC Owner changed)
