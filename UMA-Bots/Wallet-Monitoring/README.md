# Monitored Wallet Address Usage detection bot

## Description

This bot monitors specific wallet addresses (from a configurable list) that may use the [Across v2 bridge](https://across.to/) - a multichain bridge built on the [UMA protocol](https://umaproject.org/) as its source of on-chain data validation. For more details refer [here](https://discourse.umaproject.org/t/forta-monitors-across-v2-request-for-proposals/1569).

## Supported Chains
- Mainnet
- Optimism
- Arbitrum
- Polygon
  
## Alerts

- UMA-10
  - Fired whenever a `FilledRelay` event is emitted from the `SpokePool` with a monitored wallet address as the depositor
  - Severity is always set to "low" 
  - Type is always set to "info"
  - Metadata :
      - `amount`: amount that the depositor wished to relay
      - `originChainId` : relay origination chain ID
      - `destinationChainId` : relay destination chain ID
      - `depositor` : address that made the deposit on the origin chain
      - `recipient` : recipient address on the destination chain
      - `isSlowRelay` : boolean value indicating whether the relay was a slow relay
  
## Test Data

The bot behaviour can be verified with the following transactions by running `npm run tx <TX_HASH>`:

### Ethereum Mainnet
- [0xd04843daf4c52cac0e522fa3b2fd6cac3c14ced163c0576f31095d70b1756acd](https://etherscan.io/tx/0xd04843daf4c52cac0e522fa3b2fd6cac3c14ced163c0576f31095d70b1756acd) (2 findings - `FilledRelay` was emitted 3 times, out of which 2 had monitored wallet addresses as depositors)
- [0xf09b60c2f3dd17b9444cb266dc773839c85edb0fcf315ea273f2b2acec267372](https://etherscan.io/tx/0xf09b60c2f3dd17b9444cb266dc773839c85edb0fcf315ea273f2b2acec267372) (2 findings - `FilledRelay` was emitted 2 times with the same monitored wallet address acting as the depositor)

 ### Goerli Testnet (PoC)

In order to verify the Proof of Concept transactions on Goerli the appropriate `jsonRpcUrl` shall be set in `./forta.config.json`

- [0x60554718bc26a87654d02e731c4fa8a5cc5929f90fd40ae8e30cfad23fadfb36 ](https://goerli.etherscan.io/tx/0x60554718bc26a87654d02e731c4fa8a5cc5929f90fd40ae8e30cfad23fadfb36 ) (1 finding - `FilledRelay` was emitted with a monitored wallet address as depositor)