# Milestones in Terminal Total Difficulty

## Description

This bot monitors `totalDifficulty` of Ethereum blocks and calculates the estimated merge date by checking how close `totalDifficulty` is to `Terminal Total Difficulty`.
In order to find the estimated merge date, the difference between `Terminal Total Difficulty` and `totalDifficulty` is divided by the `average block difficulty` which is calculated by the last 100 blocks. This returns the estimated number of blocks left to be mined. This value is multiplied by the `average block time` which is calculated by the most recent week's number of blocks and their average block time. To make this value dynamic, new block times are used to change `average block time` accordingly.

## Supported Chains

- Ethereum

## Alerts

- ETH-1-1

  - Fired when there are `20`, `15`, `10`, and `5-1` days left until the merge
    - One alert will be emitted for each day below 5
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - metadata:
    - `estimatedMergeDate`: Estimated merge date in UTC format.
    - `latestTotalDifficulty`: The latest total block difficulty in which the alert is emitted.
    - `remainingDifficulty`: Difference between `Terminal Total Difficulty` and `latestTotalDifficulty`.

- ETH-1-2
  - Fired when `totalDifficulty` of a block is greater than or equal to `Terminal Total Difficulty`.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - metadata:
    - `totalDifficulty`: Total block difficulty in which the alert is emitted.

## Test Data

In order to test the bot, comment out the variable `TERMINAL_TOTAL_DIFFICULTY` at L3 in `src/eth.config.ts` and uncomment L19.

For 20 days alert, run:

```
npm run range 15228000..15228002
```

Block 15228000 will emit a finding, but 15228001 and 15228002 will not emit a finding.

For 15 days alert, run:

```
npm run range 15258000..15258002
```

Block 15258000 will emit a finding, but 15258001 and 15258002 will not emit a finding.

For 10 days alert, run:

```
npm run range 15290000..15290002
```

Block 15290000 will emit a finding, but 15290001 and 15290002 will not emit a finding.

For 5 days alert, run:

```
npm run range 15320000..15320002
```

Block 15320000 will emit a finding, but 15320001 and 15320002 will not emit a finding.

For merge alert, run:

```
npm run range 15351000..15351002
```

Block 15351000 will emit a finding, but 15351001 and 15351002 will not emit a finding.
