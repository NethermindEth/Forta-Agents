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
  - Triggered when a `DelegateVotesChanged` event is detected, and `newBalance` is equal or greater than `ABSOLUTE_THRESHOLD`.
  - Severity is always set to "Critical".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - `delegate`: The address of the delegate.
    - `previousBalance`: The previous vote balance of the delegate.
    - `newBalance`: The new vote balance of the delegate.

## Test Data

The bot behaviour can be verified with the following transactions on BSC testnet (PoC [contract address](https://testnet.bscscan.com/address/0xecd485df69906De0684Ecc71c4eB08d96337c468)):

  - 0x8ef40312b7f5852c725141e1271164067a1518220722def0bc89e587279542ab: (expect 1 finding:`1 DelegateVotesChanged event`) 
  - 0x11fabeb64ffd9a9269c8a594f1469add7f2d0289678dcb4b83f0e329cfcf5c04: (expect 2 findings:`2 DelegateVotesChanged events`)
  - 0x900191db983a29bc3edc519c444bb93ad756c0b60db2a131b71212112dee6dcb: (expect 3 findings:`3 DelegateVotesChanged events`)
  - 0xfc5bc52aae2e3280bca2c419556b3399b50b240aab32cdf163462f01d7bc4223: (expect 0 findings:`DelegateChanged event`)
  - 0x89730559140a4d60b11fe17a0bb0212293606fdce41e23c8437f4e95ed5d5cae: (expect 1 finding:`DelegateVotesChanged and DelegateChanged`)
  - 0x90d87e1046ea151a8757f24abd4465b2808ea00a6634f5b04798f5d16397bd32: (expect 0 findings:`Not over threshold`)
  - 0xf4db74e36a091df9855842f8bb08a53bc614ed7005a7b1b638171bf9055894c4: (expect 1 finding:`1 DelegateVotesChanged event over absolute threshold`)