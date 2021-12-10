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
  - Fired when `TokenUpdate` event is emitted
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata contains all the event parameters

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x79ba1cd497aca70928092692f79910233b05437f31aeb2042c7d6ab48437f767
- 0x1e7c5090c554c3e4b39311fdb58db799d8469675088ca9fecfac167d5492c597  
