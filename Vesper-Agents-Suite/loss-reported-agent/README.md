# Vesper Loss Reported

## Description

This agent detects when a V3 Vesper Strategy reports loss through `reportLoss` or `reportEarnings` method.


## Alerts

- Vesper-2
  - Fired `reportLoss` or `reportEarnings` is called in the `poolAccount`of some Vesper pool.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - You can find the following information in the metadata:
    - `strategyAddress`: Address of the strategy reporting the loss.
    - `lossValue`: The value reported as loss.

