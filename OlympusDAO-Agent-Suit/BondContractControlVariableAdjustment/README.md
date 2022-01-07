# ControlVariableAdjustment Agent

## Description

This agent fires finding when bond contracts emit ControlVariableAdjustment event.

## Supported Chains

- Ethereum

## Alerts

- OlympusDAO-7
  - Fired when a bond contract emits ControlVariableAdjustment event.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata field contains:
    - `initialBCV`: Value of argument initialBCV in the event emitted.
    - `newBCV`: Value of argument newBCV in the event emitted.
    - `adjustment`: Value of argument adjustment in the event emitted.
    - `addition`:Value of argument addition in the event emitted.
 
## Test Data

The agent behaviour can be verified with the following transactions:

- 0xf2fdd76800e42a0d5ff302adaa84230cf71879441a9bb9cadc4a647a697de150
