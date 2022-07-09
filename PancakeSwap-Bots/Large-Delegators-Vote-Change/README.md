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

- CAKE-10-4
  - Triggered when a `DelegateVotesChanged` event is detected, the `previousBalance` is `0` and `newBalance` is is equal or greater then `ABSOLUTE_THRESHOLD`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `delegate`: The address of the delegate.
    - `previousBalance`: The previous vote balance of the delegate.
    - `newBalance`: The new vote balance of the delegate.

## Test Data

The bot behaviour can be verified with the following transactions on BSC testnet (PoC [contract address](https://testnet.bscscan.com/address/0xF773FC72DD607535D599D83Ce3Be6dFAE4fc3F32)):

  - 0x50e35fa0fff1290a363ac8f38227e8aa6f71c5174f46b0294b81970da73bb9a6: (expect 1 finding:`1 DelegateVotesChanged event`) 
  - 0x6c40371dee347be93be3e9298b878eedf817c1266eb993e2bbe8a509ce8b8464: (expect 2 findings:`2 DelegateVotesChanged events`)
  - 0x538187df59fe03cec92e504fed0417f183fe6906eaa40c02e7e701f76f83eeca: (expect 3 findings:`3 DelegateVotesChanged events`)
  - 0x9a998b4c9e6b361d70355d61680b6503834853485df77572ead1aec90ce7056d: (expect 0 findings:`DelegateChanged`)
  - 0xb47cf0179a1564e298b20215a7c001001cdfcc33f28675ff82b650cd15b7cf82: (expect 1 finding:`DelegateVotesChanged and DelegateChanged`)
  - 0xbe19f175ae0c7d8d35d2c7457ccb06ee700f7dbb3af82f91ae91cc856122e293: (expect 0 findings:`Not over threshold`)
  - 0x9b038f0c88618ecf5c75c78738aeefed0e07c7f696cf87be18bda9e7be1ff730: (expect 1 finding:`1 DelegateVotesChanged event with previousBalance = 0`)