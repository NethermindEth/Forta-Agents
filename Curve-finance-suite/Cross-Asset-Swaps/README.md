# Cross Asset Swaps Agent

## Description

This agent detects transactions that emit `TokenUpdate` event in [SynthSwap](https://etherscan.io/address/0x58A3c68e2D3aAf316239c003779F71aCb870Ee47#code)

```python
event TokenUpdate:
    token_id: indexed(uint256)
    owner: indexed(address)
    synth: indexed(address)
    underlying_balance: uint256
```

## Supported Chains

- Ethereum

## Alerts

- CURVE-5
  - Fired when a transaction consumes more gas than 1,000,000 gas
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata contains all the event parameters

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x1b71dcc24657989f920d627c7768f545d70fcb861c9a05824f7f5d056968aeee (1,094,700 gas)
- 0x8df0579bf65e859f87c45b485b8f1879c56bc818043c3a0d6870c410b5013266 (2,348,226 gas)
