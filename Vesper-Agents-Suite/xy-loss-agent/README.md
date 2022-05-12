# XY Strategy Loss Reported

## Description

This agent detects when a XY Strategy becomes loss making.


## Alerts

- Vesper-3
  - Fired when XY strategy become loss making.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - You can find the following information in the metadata:
    - `strategyAddress`: Address of the strategy reporting the loss.
