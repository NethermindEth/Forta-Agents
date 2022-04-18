# MakerDAO Governance Module Agent

## Description

This agent detects:

- Transactions where a lift event occured in the Chief contract address with uknown addresses in the topics
- Blocks where the Chief hat address is an unknown address
- Blocks where the Chief hat address is changed or has less than `MKR_THRESHOLD` in approvals
  > MKR_THRESHOLD: 40000

There are some configurable variables in `src/config.ts`

- `CHAINLOG_CONTRACT`: The chainlog contract being monitored
- `SPELL_DEPLOYER`: The deployer of all the spells
- `KNOWN_LIFTERS`: A list of valid lifters
- `MKR_THRESHOLD`: The minumum number of approvals required for hat address

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- MakerDAO-GM-1
  - Fired on blocks where Chief hat address:
    - Is an unknown address
    - Is changed to a different address
    - Has less than 40000 MKR in approvals
  - Severity is always set to "high"
  - Type is always set to "suspicious"
  - The metadata can contains:
    - `hat` address (Always)
    - `previousHat` address (When the hat is changed)
    - `MKR` amount of the hat address (When MKR is below the threshold)
    - `threshold` amount of the hat address (When MKR is below the threshold)
- MakerDAO-GM-2
  - Fired on transaction where a lift event occured in the Chief contract and:
    - Lifter (topic 1) is an unknown address
    - Spell (topic 2) is an unknown address
  - Severity is always set to "high"
  - Type is always set to "suspicious"
  - The metadata contains the unknown address that cause the alert

## Test Data

The agent behaviour can be verified with the history of transactions of the Chief contract
