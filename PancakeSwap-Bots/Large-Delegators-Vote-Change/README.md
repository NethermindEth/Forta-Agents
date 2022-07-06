# Delegate Votes Change detection bot

## Description

This bot detects the following Cake Token events:
- `DelegateVotesChanged` event

## Supported Chains

- BSC (Binance Smart Chain)

## Alerts

- CAKE-10-1
  - Triggered when a `DelegateVotesChanged` event is detected and the percentage of the difference between `newBalance` and `previousBalance` is above `LOW_THRESHOLD`.
  - Severity is always set to "Low".
  - Type is always set to "Info".
  - Metadata contains:
    - `delegate`: The address of the delegate.
    - `previousBalance`: The previous vote balance of the delegate.
    - `newBalance`: The new vote balance of the delegate.

- CAKE-10-2
  - Triggered when a `DelegateVotesChanged` event is detected and the percentage of the difference between `newBalance` and `previousBalance` is above `MEDIUM_THRESHOLD`.
  - Severity is always set to "Medium".
  - Type is always set to "Info".
  - Metadata contains:
    - `delegate`: The address of the delegate.
    - `previousBalance`: The previous vote balance of the delegate.
    - `newBalance`: The new vote balance of the delegate.

- CAKE-10-3
- Triggered when a `DelegateVotesChanged` event is detected and the percentage of the difference between `newBalance` and `previousBalance` is above `HIGH_THRESHOLD`.
  - Severity is always set to "High".
  - Type is always set to "Info".
  - Metadata contains:
    - `delegate`: The address of the delegate.
    - `previousBalance`: The previous vote balance of the delegate.
    - `newBalance`: The new vote balance of the delegate.

## Test Data

The bot behaviour can be verified with the following transactions on BSC testnet (PoC [contract address](https://testnet.bscscan.com/address/0x0151A9301b52CCAfA75cd501Bff874C8901260b0)):

  - 0xcc72d4c3a9ec20d21358c89ea2e49140f2d7f5169bc4f8696edc21f74ce7e2dd: (expect 1 finding) 
  - 0x73ee7a17387ad2edfe572099e92fbc6160462dee7f6b79309ca3e61b5bb10317: (expect 2 findings)
  - 0xf78897dac9e76f91b9d7ca72536789dcb81e2c30482327751dc0388b7402e8a2: (expect 3 findings)
  - 0x953afe4fb1e4338bf45aab277d2d0184f2903c88235c4e2694be4932f80f9913: (expect 0 findings)
  - 0xc577be89a8603bf61c597092e890a91d7129d3307360972ca398d76cdf4b970f: (expect 1 findings)
