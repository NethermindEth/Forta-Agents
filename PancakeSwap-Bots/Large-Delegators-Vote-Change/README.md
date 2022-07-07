# Delegate Votes Change detection bot

## Description

This bot detects the following Cake Token events:
- `DelegateVotesChanged` event

The `THRESHOLDS` can be configured in the `thresholds.ts` file.

## Supported Chains

- BSC (Binance Smart Chain)

## Alerts
- CAKE-10-1
  - Triggered when a `DelegateVotesChanged` event is detected and the difference between `newBalance` and `previousBalance` is above `LOW_THRESHOLD`.
  - Severity is always set to "Low".
  - Type is always set to "Info".
  - Metadata contains:
    - `delegate`: The address of the delegate.
    - `previousBalance`: The previous vote balance of the delegate.
    - `newBalance`: The new vote balance of the delegate.

- CAKE-10-2
  - Triggered when a `DelegateVotesChanged` event is detected and the difference between `newBalance` and `previousBalance` is above `MEDIUM_THRESHOLD`.
  - Severity is always set to "Medium".
  - Type is always set to "Info".
  - Metadata contains:
    - `delegate`: The address of the delegate.
    - `previousBalance`: The previous vote balance of the delegate.
    - `newBalance`: The new vote balance of the delegate.

- CAKE-10-3
- Triggered when a `DelegateVotesChanged` event is detected and the difference between `newBalance` and `previousBalance` is above `HIGH_THRESHOLD`.
  - Severity is always set to "High".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - `delegate`: The address of the delegate.
    - `previousBalance`: The previous vote balance of the delegate.
    - `newBalance`: The new vote balance of the delegate.

## Test Data

The bot behaviour can be verified with the following transactions on BSC testnet (PoC [contract address](https://testnet.bscscan.com/address/0x114403f38a4f01b45275a726c6346E1669C19E7D)):

  - 0xdcca145fb89c4a9928abd94aa6bed679c5096878b5475e091be2e2c58e840ece: (expect 1 finding:`1 DelegateVotesChanged event`) 
  - 0x14b54498a69b10eb6c3b3dabb157e3f0d5c6ee899fcd71c307420f60f3502485: (expect 2 findings:`2 DelegateVotesChanged events`)
  - 0xb5879f3ca7582333a6b32fabe85b216049c195ee43d1c36d39f3e0efc5f46f28: (expect 3 findings:`3 DelegateVotesChanged events`)
  - 0x53fb851568fa3875f3050df76aaee8ca40532d26047ba30e8b3e490c9aa0f975: (expect 0 findings:`DelegateChanged`)
  - 0xb678808ebb1b0c825cbb8f262544dd4937f076841fe3d33d8ecb9dd9feafb44b: (expect 1 finding:`DelegateVotesChanged and DelegateChanged`)
  - 0xd517755bc9058aea67610b4af93fead1a0798ec61f559d897829ad8c1c269163: (expect 0 findings:`Not over threshold`)