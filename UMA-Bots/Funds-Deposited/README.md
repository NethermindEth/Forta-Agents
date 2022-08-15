# Funds Deposited detection bot

## Description

This bot detects the following Cake Token events:
- `FundsDeposited` event

## Supported Chains

- ETH (Ethereum Mainnet)

## Alerts
- UMA-1
  - Triggered when a `FundsDeposited` event is detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
  - `amount`: amount of tokens deposited
  - `originChainId`: token origin chain Id
  - `destinationChainId`: token destination chain Id
  - `token`: token name

## Test Data

The bot behaviour can be verified with the following transactions on Goerli testnet (PoC contract address is:[0x49bbe549f0db98d0240c98fa170959e70b561757](https://goerli.etherscan.io/address/0x49bbe549f0db98d0240c98fa170959e70b561757)):

- [0xc1ef045a10c696658af7b49ebbb812eb06d49285673abd204192662625197ead]
(https://goerli.etherscan.io/tx/0xc1ef045a10c696658af7b49ebbb812eb06d49285673abd204192662625197ead): (expect 1 finding: 1 `FundsDeposited` event)

- [0xbaddf68ca66cb0eda1d24c143389b1c40c31da0d2333476f55ecdfcda73f3394]
(https://goerli.etherscan.io/tx/0xbaddf68ca66cb0eda1d24c143389b1c40c31da0d2333476f55ecdfcda73f3394): (expect 2 findings: 2 `FundsDeposited` events)

- [0xdefaa858728351df5aba25af86e1b15966d71c5d7f694552d5ff9a4b0740c8a6]
(https://goerli.etherscan.io/tx/0xdefaa858728351df5aba25af86e1b15966d71c5d7f694552d5ff9a4b0740c8a6): (expect 1 finding: 1 `FundsDeposited` event and 0 `SetDepositQuoteTimeBuffer` event)


The bot behaviour can be verified with the following transactions on Ethereum mainnet ( Contract address is:[0x4D9079Bb4165aeb4084c526a32695dCfd2F77381](https://etherscan.io/address/0x4D9079Bb4165aeb4084c526a32695dCfd2F77381)):

- [0x5e4fba4cd311755ea750942fcd51329abaa37ce7f535e4e0f5180fa53f506d70]
(https://etherscan.io/tx/0x5e4fba4cd311755ea750942fcd51329abaa37ce7f535e4e0f5180fa53f506d70): (expect 1 finding: 1 `FundsDeposited` event)

- [0x0b2b837ef4db4b91181e1546beca4c490d670d589414fd0797fae673d9e7133f]
(https://etherscan.io/tx/0x0b2b837ef4db4b91181e1546beca4c490d670d589414fd0797fae673d9e7133f): (expect 1 finding: 1 `FundsDeposited` event)

- [0x71116c8401fb972df7dcd0a934cf76a98169426ae609a76fa07b5542c434ad2f]
(https://etherscan.io/tx/0x71116c8401fb972df7dcd0a934cf76a98169426ae609a76fa07b5542c434ad2f): (expect 1 finding: 1 `FundsDeposited` event)

- [0x8065629c8fbc3d58b54557b999595ae395f2d5546e45bc3f70c659b5f90e67c3]
(https://etherscan.io/tx/0x8065629c8fbc3d58b54557b999595ae395f2d5546e45bc3f70c659b5f90e67c3): (expect 1 finding: 1 `FundsDeposited` event)

- [0x9665474a0ddfc5ac40b5cf8d1650a650dd2659530b187b516b4ca62b0f2b558b]
(https://etherscan.io/tx/0x9665474a0ddfc5ac40b5cf8d1650a650dd2659530b187b516b4ca62b0f2b558b): (expect 1 finding: 1 `FundsDeposited` event)

- [0x2c01e39c501a5c923f37e44e857948cb39f3da22d9b157d0b150ac9998143355]
(https://etherscan.io/tx/0x2c01e39c501a5c923f37e44e857948cb39f3da22d9b157d0b150ac9998143355): (expect 1 finding: 1 `FundsDeposited` event)
