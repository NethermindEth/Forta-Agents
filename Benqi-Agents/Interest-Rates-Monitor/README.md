# Qi Tokens Interest Rates Monitor

## Description

This bot detects BenQi's `QiTokens` interest rates threshold excesses.

> QiTokens can be added and thresholds can be changed in `src/utils.ts`.

## Supported Chains

- Avalanche

## Alerts

- BENQI-6-1

  - Fired when it detects that `QiToken`'s **supply** interest rate has **dropped** below lower threshold.
  - Severity is always set to "Medium".
  - Type is always set to "Info".
  - Metadata contains:
    - `tokenAddress`: QiToken's address.
    - `supplyInterestRate`: QiToken's supply interest rate.
    - `lowerRateThreshold`: QiToken supply interest rate's lower threshold.

- BENQI-6-2

  - Fired when it detects that `QiToken`'s **supply** interest rate has **exceeded** upper threshold.
  - Severity is always set to "Medium".
  - Type is always set to "Info".
  - Metadata contains:
    - `tokenAddress`: QiToken's address.
    - `supplyInterestRate`: QiToken's supply interest rate.
    - `upperRateThreshold`: QiToken supply interest rate's upper threshold.

- BENQI-6-3

  - Fired when it detects that `QiToken`'s **borrow** interest rate has **dropped** below lower threshold.
  - Severity is always set to "Medium".
  - Type is always set to "Info".
  - Metadata contains:
    - `tokenAddress`: QiToken's address.
    - `borrowInterestRate`: QiToken's borrow interest rate.
    - `lowerRateThreshold`: QiToken borrow interest rate's lower threshold.

- BENQI-6-4
  - Fired when it detects that `QiToken`'s **borrow** interest rate has **exceeded** upper threshold.
  - Severity is always set to "Medium".
  - Type is always set to "Info".
  - Metadata contains:
    - `tokenAddress`: QiToken's address.
    - `borrowInterestRate`: QiToken's borrow interest rate.
    - `upperRateThreshold`: QiToken borrow interest rate's upper threshold.

## Test Data

In order to use the `PoC QiTokens Contracts` and generate the expected findings:

1. Replace `COMPTROLLER_ADDR` by testnet address on `utils.ts L05`
2. Change the `jsonRpcUrl` in `forta.config.json` to `https://api.avax-test.network/ext/bc/C/rpc`.
3. Replace `THRESHOLD` object with the test values by following comment on `utils.ts L21`:

### Avalanche Testnet

The bot behaviour can be verified in the following blocks:

- 7751790

  Generated finding:

  - `description`: "A qiToken's supply interest rate dropped below lower threshold"
  - `tokenAddress`: 0xba1d29adebbfb8f79eca81a44f8354539ef32adb
  - `supplyInterestRate`: 0
  - `upperRateThreshold`: 10000

- 7752583

  Generated findings:

  1.

  - `description`: "A qiToken's borrow interest rate dropped below lower threshold"
  - `tokenAddress`: 0x106958df060b0bb19223c2666bf57fa9f065b6a0
  - `borrowInterestRate`: 8000
  - `lowerRateThreshold`: 10000

  2.

  - `description`: "qiQI token's borrow interest rate exceeded upper threshold"
  - `tokenAddress`: 0xba1d29adebbfb8f79eca81a44f8354539ef32adb
  - `borrowInterestRate`: 7300000000
  - `upperRateThreshold`: 6200000000
