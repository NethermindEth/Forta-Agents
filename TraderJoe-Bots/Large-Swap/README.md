# Large Swap Bot

## Description

This bot detects swaps from valid pair contracts when any `amount` argument is high.
> Currently, high is set to greater than or equal to `20%`.

## Supported Chains

- Avalanche

## Alerts

- TRADERJOE-03
  - Fired when `Swap` event is emitted with an `amount` argument that exceeds the threshold.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata includes:
    - `sender`: Address that initialized swap.
    - `amount0In`: Amount of token0 in.
    - `amount1In`: Amount of token1 in.
    - `amount0Out`: Amount of token0 out.
    - `amount1Out`: Amount of token1 out.
    - `to`: Recipient address.

## Test Data

The bot behavior can be verified with the following contracts on the Kovan ETH testnet:

[0x3CAfAF7cA21ccfeB3B09CCC8a7e03109d207CDc4](https://kovan.etherscan.io/address/0x3cafaf7ca21ccfeb3b09ccc8a7e03109d207cdc4) - `TestJoeFactory`.

[0xDF31A3B3bF5e738895f477d0c65973ed6D275bb4](https://kovan.etherscan.io/address/0xdf31a3b3bf5e738895f477d0c65973ed6d275bb4) - `TestJoePair`.

[0x2cc8688C5f75E365aaEEb4ea8D6a480405A48D2A](https://kovan.etherscan.io/address/0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a#contracts) - `Multicall` (deployed by MakerDAO, code [here](https://github.com/makerdao/multicall/blob/master/src/Multicall.sol)).


[0x3bfd88457cd5161a44f95231e777cc26c66424985fed5c089bc941af55b861c6](https://kovan.etherscan.io/tx/0x3bfd88457cd5161a44f95231e777cc26c66424985fed5c089bc941af55b861c6) - "Large" `Swap` event emission.