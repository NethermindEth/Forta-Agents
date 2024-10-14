# Large Capital Liquidations Monitor Bot

## Description

This bot detects large borrow positions liquidation risk and absorptions in
Compound v3 Comet contracts.

At startup, this bot filters all `Supply`, `Transfer`, `Withdraw` and
`AbsorbDebt` events on the assigned Comet contracts, checks potential
borrowers' principals and builds a list of the biggest borrowers. This process
can take several minutes, especially considering rate limiting was added to
the log fetching to avoid problems with the bot runner provider limits.
This process is logged and should be available in the bot logs once it's
running.

After the initialization process the bot will then handle block events. On
each block:

* If there's a principal-changing event (`Supply`, `Transfer`, `Withdraw` and
`AbsorbDebt`) happens the potential borrower principal is fetched and added
to the monitoring list. In the case of absorptions, if the absorbed amount is
"large" then the associated finding is directly created.
* All the finding-eligible (based on the "large" threshold and alert cooldown)
monitored positions are checked for borrow collateralization through calls to
`isBorrowCollateralized`. For each uncollateralized borrow, a finding is
emitted.

The monitoring list has a size limit, but ideally its limit should not matter
provided the "large" threshold users are all included in it and there's some
buffer left. In the edge case that "large" users are potentially being ignored
because all of them do not fit into the monitoring list, warning logs will be
emitted and should be available in the bot logs.

This is an overall safer approach than locally computing the borrow state
because it does not require managing the collateral amounts locally, which can
lead to inconsistencies, and both a batched RPC provider and multicalls are
used to call `isBorrowCollateralized` for multiple accounts at the same time,
which really mitigates the issues of making this many calls at once in terms
of network latency.

Finally, each finding includes the associated block - this is because Forta
agents have a limit of `50` findings per event, so if more findings are
generated in a block, they are stored and sent on subsequent block events.

The Comet deployment addresses for each network and other parameters can be
configured in the `agent.config.ts` file.

## Supported Chains

- Ethereum
- Polygon
- Arbitrum

As proposed, this bot was designed with Ethereum in mind, so while Polygon and
other chains besides Ethereum can be supported, the block rate needs to be
considered when setting the bot parameters.

More networks can easily be supported by adding the network parameters to
`agent.config.ts` and the chain ID to the `chainIds` field in `package.json`!

## Alerts

Below are the alerts that can be emitted from this bot. The title and
description of the findings, as well as the severity and type, can be found
and modified in the `src/finding.ts` file.

- COMP2-4-1
  - Fired when there's a large debt absorption on a Comet contract
  - Severity is always set to "Medium"
  - Type is always set to "Info"
  - Metadata:
    - `block`: Block in which the finding was generated
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
    - `block`: Block in which the finding was generated
    - `chain`: Network chain ID or name
    - `comet`: Address of the related Comet contract
    - `borrower`: Address of the borrower
    - `positionSize`: Base asset present value of the position, in the base asset
    scale

## Test Data

Besides unit tests, which can be executed through `npm run test`, you can also
test this bot with real data. First, set up an Ethereum Mainnet RPC in your
`forta.config.json` file, then enable the debug mode in `agent.config.ts` by
setting the `DEBUG` flag to `true`. This will mainly make it possible to test
the initialization step. Now, run the following command to execute the bot in a
block range:

```
npm run range 15419040..15419043
```

The bot will, in the initialization step, get all potential borrowers through
events from block `15331586` (set as the Comet deployment block in the debug
config) to block `15419040`, set as the `DEBUG_CURRENT_BLOCK`.

Then, on block `15419040`, the first one a block event is actually handled,
a finding will be emitted because a "large" borrow position is not
collateralized, and on block `15419043` this same position is then absorbed,
which leads to an absorption finding.
