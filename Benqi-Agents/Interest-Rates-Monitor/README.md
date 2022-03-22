# Qi Tokens Interest Rates Monitor

## Description

This agent detects BenQi's `QiTokens` interest rates threshold excesses.

> QiTokens can be added and thresholds can be changed in `src/utils.ts`.

## Supported Chains

- Avalanche

## Alerts

- BENQI-6-1 
    * Fired when it detects that `QiToken`'s **supply** interest rate has **dropped** below lower threshold.
    * Severity is always set to "Medium".
    * Type is always set to "Suspicious".
    * Metadata contains: 
        * `token`: QiToken's name.
        * `tokenAddress`: QiToken's address.
        * `supplyInterestRate`: QiToken's supply interest rate.
        * `lowerRateThreshold`: QiToken supply interest rate's lower threshold.
        * `thresholdExceededBy`: Threshold excess percentage. 

- BENQI-6-2 
    * Fired when it detects that `QiToken`'s **supply** interest rate has **exceeded** upper threshold.
    * Severity is always set to "Medium".
    * Type is always set to "Suspicious".
    * Metadata contains: 
        * `token`: QiToken's name.
        * `tokenAddress`: QiToken's address.
        * `supplyInterestRate`: QiToken's supply interest rate.
        * `upperRateThreshold`: QiToken supply interest rate's upper threshold.
        * `thresholdExceededBy`: Threshold excess percentage. 
   
- BENQI-6-3 
    * Fired when it detects that `QiToken`'s **borrow** interest rate has **dropped** below lower threshold.
    * Severity is always set to "Medium".
    * Type is always set to "Suspicious".
    * Metadata contains: 
        * `token`: QiToken's name.
        * `tokenAddress`: QiToken's address.
        * `borrowInterestRate`: QiToken's borrow interest rate.
        * `lowerRateThreshold`: QiToken borrow interest rate's lower threshold.
        * `thresholdExceededBy`: Threshold excess percentage. 
  
- BENQI-6-4 
    * Fired when it detects that `QiToken`'s **borrow** interest rate has **exceeded** upper threshold.
    * Severity is always set to "Medium".
    * Type is always set to "Suspicious".
    * Metadata contains: 
        * `token`: QiToken's name.
        * `tokenAddress`: QiToken's address.
        * `borrowInterestRate`: QiToken's borrow interest rate.
        * `upperRateThreshold`: QiToken borrow interest rate's upper threshold.
        * `thresholdExceededBy`: Threshold excess percentage. 

