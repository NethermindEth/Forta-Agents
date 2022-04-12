# Role Changes

## Description

This agent detects transactions Role changes related function calls in Ondo Registry
> Functions:
>
> - addStrategist
> - grantRole
> - renounceRole
> - revokeRole
>
> Registry: 0xf69c52bf2cf76250647c0bb5390d4ba8854a1d4a


## Supported Chains

- Ethereum

## Alerts

- ONDO-1
  - Fired when a transaction execute one or more of the above functions in Ondo Registry
  - Severity is always set to "Medium"
  - Type is always set to "Suspicious"
  - Metadata contains:
    - `sender`: Address calling the function
    - `method`: The name of the function invoked
    - All the parameters of the function called

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x7dc6b941d9aa6a09289a25f83af273f762e27e3149454c4788b6c2b64736456d (4 grantRole calls)
