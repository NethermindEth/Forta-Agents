# Funds Deposited detection bot

## Description

This bot detects the following SpokePool events:
- `FundsDeposited` event

## Supported Chains

- Ethereum
- Arbitrum
- Polygon
- Optimism

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
  - `depositor`: depositor address
  - `recipient`: recipient address

## Test Data

### Goerli Testnet
The bot behaviour can be verified with the following transactions on Goerli testnet (PoC contract address is:[0xBC760257763b77aeEa256c129e09DB41bD2c1450](https://goerli.etherscan.io/address/0xBC760257763b77aeEa256c129e09DB41bD2c1450)):

- [0xe346b3c417ac1ec06034d381d70f5b9d87fa92d60a0fa9df452241c4e313bbe1]
(https://goerli.etherscan.io/tx/0xe346b3c417ac1ec06034d381d70f5b9d87fa92d60a0fa9df452241c4e313bbe1): (expect 1 finding: 1 `FundsDeposited` event)

- [0x0d3f92a6c0c93f69a8d2e430960bc10ac54b60ced2a81daf92efec1eebfbf38c]
(https://goerli.etherscan.io/tx/0x0d3f92a6c0c93f69a8d2e430960bc10ac54b60ced2a81daf92efec1eebfbf38c): (expect 2 findings: 2 `FundsDeposited` events)

- [0x1838018ab012bf5d76ec48c64ddabdb65679478ea93ac45b654052a90d6e8fb9]
(https://goerli.etherscan.io/tx/0x1838018ab012bf5d76ec48c64ddabdb65679478ea93ac45b654052a90d6e8fb9): (expect 1 finding: 1 `FundsDeposited` event and 0 `SetDepositQuoteTimeBuffer` event)

### Ethereum
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

### Arbitrum

The bot behaviour can be verified with the following transactions on Arbitrum mainnet ( Contract address is:[0xb88690461ddbab6f04dfad7df66b7725942feb9c](https://arbiscan.io/address/0xb88690461ddbab6f04dfad7df66b7725942feb9c)):

- [0xaa18db0dc291370f37d3cc4d059e397c4b3326fa4712e48ac5c69ef059e8ab32]
(https://arbiscan.io/tx/0xaa18db0dc291370f37d3cc4d059e397c4b3326fa4712e48ac5c69ef059e8ab32): (expect 1 finding: 1 `FundsDeposited` event)

- [0x3cbd6619e70e6cb44404fd35ff8bcd0b55e0152384a80cb2e999bf211e467fc5]
(https://arbiscan.io/tx/0x3cbd6619e70e6cb44404fd35ff8bcd0b55e0152384a80cb2e999bf211e467fc5): (expect 1 finding: 1 `FundsDeposited` event)

- [0xe7e4bfb4a4160a06a733941fa6d8c6093c3a668537b2a8280ad23db706867a43]
(https://arbiscan.io/tx/0xe7e4bfb4a4160a06a733941fa6d8c6093c3a668537b2a8280ad23db706867a43): (expect 1 finding: 1 `FundsDeposited` event)

### Polygon

The bot behaviour can be verified with the following transactions on Polygon mainnet ( Contract address is:[0xd3ddacae5afb00f9b9cd36ef0ed7115d7f0b584c](https://polygonscan.com/address/0xd3ddacae5afb00f9b9cd36ef0ed7115d7f0b584c)):

- [0x1cf74a701413c009c720ac25dd439af09bc44e985b38953b2041790a42e93a4c]
(https://polygonscan.com/tx/0x1cf74a701413c009c720ac25dd439af09bc44e985b38953b2041790a42e93a4c): (expect 1 finding: 1 `FundsDeposited` event)

- [0x4cdf546e8ebe3c3d9e3821dbc92c509661937ec345540e751ec77bb71a4c6243]
(https://polygonscan.com/tx/0x4cdf546e8ebe3c3d9e3821dbc92c509661937ec345540e751ec77bb71a4c6243): (expect 1 finding: 1 `FundsDeposited` event)

- [0xebdb36d5fc0562ada8e6e1e502c52c1547587214c72f86baebe13fabd40bc802]
(https://polygonscan.com/tx/0xebdb36d5fc0562ada8e6e1e502c52c1547587214c72f86baebe13fabd40bc802): (expect 1 finding: 1 `FundsDeposited` event)

### Optimism

The bot behaviour can be verified with the following transactions on Optimism mainnet ( Contract address is:[0xa420b2d1c0841415a695b81e5b867bcd07dff8c9](https://optimistic.etherscan.io/address/0xa420b2d1c0841415a695b81e5b867bcd07dff8c9)):

- [0xd2021fb19d3de589008aa761e7ce5e4ec6e26f5a5c1126795c45a39ec6cca0df]
(https://optimistic.etherscan.io/tx/0xd2021fb19d3de589008aa761e7ce5e4ec6e26f5a5c1126795c45a39ec6cca0df): (expect 1 finding: 1 `FundsDeposited` event)

- [0xc726f6a34f9321baee5737d7c1b9b823538aeaef1446a4d262785a4ed273adb9]
(https://optimistic.etherscan.io/tx/0xc726f6a34f9321baee5737d7c1b9b823538aeaef1446a4d262785a4ed273adb9): (expect 1 finding: 1 `FundsDeposited` event)

- [0xaf6054f041b0b972e2383d6f85060e43daf224cf45e4feb2f291e691aa377e20]
(https://optimistic.etherscan.io/tx/0xaf6054f041b0b972e2383d6f85060e43daf224cf45e4feb2f291e691aa377e20): (expect 1 finding: 1 `FundsDeposited` event)
