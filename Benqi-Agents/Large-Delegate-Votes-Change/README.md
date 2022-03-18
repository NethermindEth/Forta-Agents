# Delegate Votes Monitor Agent

## Description

This agent detects large (>= 30%) increments in an addresses' QI token
delegate votes balance.

## Supported Chains

- Avalanche

## Alerts

- BENQI-1-1
  - Fired when a delegate account's vote balance increases by 30% or more.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata contains:
    - `delegate`: Address of the related delegate
    - `previousBalance`: Previous delegate vote balance
    - `newBalance`: Current delegate vote balance

## Test Data

The agent behaviour can be verified with the following transactions:

  - 0xa47ecb9d12a9baff66c6ba7367ec5edfc7ba02ba459cb9d5a7f01f0e847d97e4
  - 0x19f58902bb5aceb7cd932693e3e172c9b46d53c331e4e6ca3c4ac9fd1f049580
  - 0x0f0a1728287e1573fa5e4c673e2c51b08ca4e7ac29e232777285a9a2125c0202
  - 0xdd27205d116bd4527ab632aa4e8558180106dce732829a501defe2066b27969d
  - 0xdecff8aa031cb5ecc22735cfba6fca910c06764000f8f5dbab85a36963a70771
  - 0xa06aa03f91309b4e9157f2628de6f9a55858e441370d961a8a08d06583d5db60
  - 0x9f7bbe92f00b40433cd9b7f9876fff9074308ba1c581ccb18c1a9cf4c34a3472
  - 0x8143087bf4f49b7cc9a114338c602dba17e73f72878f9c3094c4878b4c14899a
  - 0x4d27ef37bc4510c73d185e6513cbcd11d8618efaeb95a95c7df10d07475a7c88
  - 0x72b1043a6585450845b239ea7bf168deb784465e9d90317ce6bf2a15f712dae1
