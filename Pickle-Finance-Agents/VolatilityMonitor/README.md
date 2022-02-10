# Pickle Volatility Monitor

## Description

Monitors how often the strategies are rebalancing and determines if range changes need to occur.

## Supported Chains

- Polygon

## Alerts

- pickle-vm-1
  - Fired when a multiple calls occurred with the same `performData` in a short/medium period of time
  - Severity is set to "High" if short and set to "Medium" if medium 
  - Type is always set to "Info" 
  - Metada contains:
    - `keeperId`: The `id` used in the `performUpkeep` call
    - `keeperAddress`: Address of the keeper associated with `id`
    - `strategyAddress`: Strategy used in `performData`
    - `timeSinceLastUpkeep`: Time passed since the last `performUpkeep` call with the same `id/strategy` pair
    - `numberOfUpkeepsToday`: Number of calls detected in the period of time,
    - `timeFrame`: The duration of the period,

- pickle-vm-2
  - Fired when a huge time passed without calling `performUpkeep` with some `id/strategy` pairs
  - Severity is always set to "Medium" 
  - Type is always set to "Info" 
  - Metada contains:
    - `keeperId`: The `id` used in the `performUpkeep` call
    - `keeperAddress`: Address of the keeper associated with `id`
    - `strategyAddress`: Strategy used in `performData`
    - `timeSinceLastUpkeep`: Time passed since the last `performUpkeep` call with the same `id/strategy`
    - `numberOfUpkeepsToday`: Number of calls detected in the period of time,
    - `timeFrame`: The duration of the period,
  > `numberOfUpkeepsToday` is ommitted in this alert because it always will be 0
