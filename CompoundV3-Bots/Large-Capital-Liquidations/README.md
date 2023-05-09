# Large Capital Liquidations Bot

## Description

This bot detects large borrow positions liquidation risk and absorptions on
Comet contracts.

At startup, this bot filters all `Supply`, `Transfer`, `Withdraw` and
`AbsorbDebt` events on the assigned Comet contracts, checks potential
borrowers' principals and builds a list of the biggest borrowers. This process
can take several minutes, especially considering there's some rate limiting
on the log fetching to avoid problems with the bot runner provider limits.
This process is logged and should be available in the bot logs once it's
running.

Then, after this process is done, the bot handles block events. Filtering 
principal-changing events, i.e. `Supply`, `Transfer`, `Withdraw` and
`AbsorbDebt`, whenever one of those happens the potential borrower principal
is fetched and it's added to the monitoring list. In the case of absorptions,
if the absorbed amount is "large" then the associated finding is created.

With this, all current "large" positions, based on the current borrow index
and the principal, are then checked for borrow collateralization through
calls to `isBorrowCollateralized`. If it's not, then a finding is emitted
provided it has not been emitted shortly before (configurable through the
`alertInterval` configuration field).

The monitoring list has a size limit, but ideally its limit should not matter
provided the "large" threshold users are all included in it and there's some
buffer left. In the edge case that "large" users are potentially being ignored
because all of them do not fit into the monitoring list, warning logs will be
emitted.

This is an overall safer approach than locally computing the borrow state
because it does not require managing the collateral amounts locally, which can
lead to inconsistencies, and both a batched RPC provider and multicalls are
used to call `isBorrowCollateralized` for multiple accounts at the same time,
which really mitigates the issues of making this many calls at once in terms
of network latency.

The Comet deployment addresses for each network and other parameters can be
configured in the `agent.config.ts` file.

## Supported Chains

- Ethereum
- Polygon

## Alerts

- COMP2-4-1
  - Fired when there's a large debt absorption on a Comet contract
  - Severity is always set to "Medium"
  - Type is always set to "Info"
  - Metadata:
    - `chain`: Network chain ID or name
    - `comet`: Address of the related Comet contract
    - `absorber`: Address of the absorber
    - `borrower`: Address of the borrower
    - `basePaidOut`: Base asset absorbed amount

- COMP2-4-2
  - Fired when a large borrowing position is not collateralized anymore
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata:
    - `chain`: Network chain ID or name
    - `comet`: Address of the related Comet contract
    - `borrower`: Address of the borrower
    - `positionSize`: Base asset present value of the position, in the base asset scale

## Test Data

Besides unit tests, you can also test this bot with real data. First, set up
an Ethereum Mainnet RPC in your `forta.config.json` file, then enable the
debug mode in `agent.config.ts` by setting the `DEBUG` flag to `true`. This
will mainly make it possible to test the initialization step. Now, run:

```
npx forta-agent run --range 15419040..15419043
```

The bot will, in the initialization step, get all potential borrowers through
events from block `15331586` (set as the Comet deployment block in the debug
config) to block `15419040`, set as the `DEBUG_CURRENT_BLOCK`.

Then, on block `15419040`, the first one a block event is actually handled,
a finding will be emitted because a "large" borrow position is not
collateralized, and on block `15419043` this same position is then absorbed,
which leads to an absorption finding.
