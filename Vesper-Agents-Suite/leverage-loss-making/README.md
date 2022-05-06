# Leverage Loss Reported

## Description

This agent detects when a Leverage Vesper Strategy becomes loss making.


## Alerts

- Vesper-3
  - Fired when leverage strategy becaome loss making, `isLossMaking` return true.
  - Severity is always set to "Warn".
  - Type is always set to "Warn".
  - You can find the following information in the metadata:
    - `strategyAddress`: Address of the strategy reporting the loss.
