# Delegate Votes Change detection bot

## Description

This bot detects the following Cake Token events:
- `DelegateVotesChanged` event

## Supported Chains

- BSC (Binance Smart Chain)

## Alerts
  The `THRESHOLDS` can be configured in the `thresholds.ts` file.
- CAKE-10-1
  - Triggered when a `DelegateVotesChanged` event is detected and the difference between `newBalance` and `previousBalance` is above `LOW_THRESHOLD`.
  - Severity is set to "Low".
  - Type is set to "Info".
  - Metadata contains:
    - `delegate`: The address of the delegate.
    - `previousBalance`: The previous vote balance of the delegate.
    - `newBalance`: The new vote balance of the delegate.

- CAKE-10-2
  - Triggered when a `DelegateVotesChanged` event is detected and the difference between `newBalance` and `previousBalance` is above `MEDIUM_THRESHOLD`.
  - Severity is set to "Medium".
  - Type is set to "Info".
  - Metadata contains:
    - `delegate`: The address of the delegate.
    - `previousBalance`: The previous vote balance of the delegate.
    - `newBalance`: The new vote balance of the delegate.

- CAKE-10-3
- Triggered when a `DelegateVotesChanged` event is detected and the difference between `newBalance` and `previousBalance` is above `HIGH_THRESHOLD`.
  - Severity is set to "High".
  - Type is set to "Suspicious".
  - Metadata contains:
    - `delegate`: The address of the delegate.
    - `previousBalance`: The previous vote balance of the delegate.
    - `newBalance`: The new vote balance of the delegate.

## Test Data

The bot behaviour can be verified with the following transactions on BSC testnet (PoC [contract address](https://testnet.bscscan.com/address/0x4B8432e8eEF48d4A4A978c4679d63B544fcA7b99)):

  - 0x94551952afffff95c667d3e99b549b41949022f994c3ba55c67b6b31c6cb372e: (expect 1 finding:`1 DelegateVotesChanged event`) 
  - 0xc3c83ca2bbb626d809098397a15931d20407625f44aa492e7f139fca0efd8097: (expect 2 findings:`2 DelegateVotesChanged events`)
  - 0x65f98ad0b978f9b882384fa9e824629f4f64ae8e553a922a26e114fcb897213d: (expect 3 findings:`3 DelegateVotesChanged events`)
  - 0x3d14819abdf912302a5a2b54947968b791af94d80824c28649cc9494368247e4: (expect 0 findings:`MockEvent`)
  - 0xc8195236392554d0b0a88c9b458d071b8abeeadc67d95e10f9b9fbc8d62316aa: (expect 1 finding:`DelegateVotesChanged and MockEvent`)
  - 0xaf458d3f1b78e3a7226cda049a255fbd9acda2f3751c1326a4424cf13526fa8b: (expect 0 findings:`Not over threshold`)