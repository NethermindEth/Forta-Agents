
# Delegations Monitor Agent

## Description

This agent detects users with a huge balance delegating their votes.

## Supported Chains

- Avalanche

## Alerts


- BENQI-2
  - Fired when a user with a balance greater than the threshold delagates his votes.

  - Severity is always set to "Info" 
  - Type is always set to "Info" 
  - Metadata includes:
    * `delegator`: address of the user delegating his votes

    * `fromDelegate`: address of the current delegate
    * `toDelegate`: address of the new delegatee

    * `balance`: balance of the delegator

## Test Data

The agent behaviour can be verified with the following transactions:
- 0xaa95f9b6cd19ccd822d5a1f00c6a8fefbb5348a2eaa7d3cb9b9091856f59ef9e
