# Delegate Votes Monitor bot

## Description

This bot detects large increments in a delegate account's QI token vote
balance by monitoring `DelegateVotesChanged` events emitted by the token
contract.

The threshold that determines whether a change is classified as large is
adjustable in the `constants.ts` file.

## Supported Chains

- Avalanche

## Alerts

- BENQI-1
  - Fired when a delegate account's vote balance increase, based on the
    previous amount, is greater than or equal to a specified percentage.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata contains:
    - `delegate`: Address of the related delegate
    - `previousBalance`: Previous delegate vote balance
    - `newBalance`: Current delegate vote balance

## Test Data

The bot behaviour can be verified with the following transactions:

- 0xa47ecb9d12a9baff66c6ba7367ec5edfc7ba02ba459cb9d5a7f01f0e847d97e4 (1 finding)
- 0x19f58902bb5aceb7cd932693e3e172c9b46d53c331e4e6ca3c4ac9fd1f049580 (1 finding)
- 0x0f0a1728287e1573fa5e4c673e2c51b08ca4e7ac29e232777285a9a2125c0202 (1 finding)
- 0x740bfa4d893f1bf2b81006e2894161b9aeeaa9271c35c347708c83f3d4a0a2b1 (no findings)
- 0x7178c1023f57bc3e8cf678a1b94300b1f5d307f8803ca46a124f2862c0f3afb7 (no findings)
- 0x32c1000eaf9fb321a93cc8fd243fffc4fa21236ccc3a12a4dde2b49dae05ba9e (no findings)
