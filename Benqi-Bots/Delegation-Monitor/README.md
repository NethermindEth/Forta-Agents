# Delegations Monitor Bot

## Description

This Bot detects users with a huge balance delegating their votes.

## Supported Chains

- Avalanche

## Alerts

- BENQI-2
  - Fired when a user with a balance greater than the threshold delagates his votes.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata includes:
    - `delegator`: address of the user delegating his votes
    - `fromDelegate`: address of the current delegate
    - `toDelegate`: address of the new delegatee
    - `balance`: balance of the delegator

## Test Data

There are no transactions including delegate votes on QI contract. We have deployed a PoC contract to emit the monitored events. The agent behaviour can be verified with the following test transactions (Avalanche Testnet):

> note that `provideHandleTransaction` inputs in the default export of `agent.ts` need to be changed to use `util.TEST_QI_CONTRACT` instead of `QI_CONTRACT`.
> The bot behaviour can be verified with the following transactions:

- 0x712b53c81428662ed906b1571831f2865cd79a7c2d9514551199f45c0469b3fb(1 findings)
- 0x194b328faf28f652179af93ed9c51944289d64750a93847977a5e4f9d86a4bf1(1 findings)
- 0xc8295477c18cb35e3a4465c07b162c454683b68000ccfb84b7943ef698558d3b(0 findings)
