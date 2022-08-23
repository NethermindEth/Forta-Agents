# Milestones in Terminal Total Difficulty

## Description

This bot monitors `totalDifficulty` of Ethereum blocks and calculates the estimated merge date by checking how close `totalDifficulty` is to `Terminal Total Difficulty`.

## Supported Chains

- Ethereum

## Alerts

- ETH-1-1

  - Fired when there are `20-16`, `15-11`, `10-6` or `5-1` days left for the merge
  - One alert will be emitted per the gaps `20-16`, `15-11` and `10-6`
  - One alert will be emitted for each day below 5
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - metadata:
    - `estimatedMergeDate`: Estimated merge date in UTC format.
    - `latestTotalDifficulty`: The latest total block difficulty in which the alert is emitted.
    - `remainingDifficulty`: Difference between `Terminal Total Difficulty` and `latestTotalDifficulty`.

- ETH-1-2
  - Fired when `totalDifficulty` of a block is greater than or equal to `Terminal Total Difficulty`.
  - Only one alert will be emitted
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - metadata:
    - `totalDifficulty`: Total block difficulty in which the alert is emitted.

## Test Data

- ETH-1-1

  In order to test the bot, uncomment the lines between 21-24 in `src/eth.config.ts` and run:

  `npm run range 15386000..15386002`

  Block 15386000 will emit a finding, but 15386001 and 15386002 will not emit a finding.

- ETH-1-2

  In order to test the bot, comment out the 3rd line in `src/eth.config.ts` and uncomment the 5th line and run:

  `npm run range 15351000..15351002`

  Block 15351000 will emit a finding, but 15351001 and 15351002 will not emit a finding.
