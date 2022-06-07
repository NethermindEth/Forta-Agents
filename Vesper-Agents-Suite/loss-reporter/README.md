# Loss Reporter

## Description

This agent detects when a Vesper Strategy reports loss through `reportLoss` or `reportEarnings` method.


## Alerts

- Vesper
  - Fired `reportLoss` or `reportEarnings` is called in the `poolAccount`of some Vesper pool.
  - Severity is always set to "Info".
  - Added strategyAddress, strategyName, poolName, poolStrategy and lossValue in description.
  - Type is always set to "Info".
  - You can find the following information in the metadata:
    - `strategyAddress`: Address of the strategy reporting the loss.
    - `lossValue`: The value reported as loss.

