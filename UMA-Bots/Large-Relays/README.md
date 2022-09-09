# Large Relays detection bot

## Description

This bot monitors for large relays (with configurable thresholds) made with [Across v2 bridge](https://across.to/) - a multichain bridge built on the [UMA protocol](https://umaproject.org/) as its source of on-chain data validation. For more details refer [here](https://discourse.umaproject.org/t/forta-monitors-across-v2-request-for-proposals/1569).

## Supported Chains
- Mainnet
- Optimism
- Arbitrum
- Polygon
  
## Alerts

- UMA-7
  - Fired whenever a `FilledRelay` event is emitted from the `SpokePool` with an amount of tokens greater than or equal to the thresholds given in `./chainThresholds.ts`
  - Severity is always set to "info" 
  - Type is always set to "info"
  - Metadata :
      - `amount`: amount that the depositor wished to relay
      - `destinationToken`: relay destination chain token address
      - `originChainId`: relay origination chain ID
      - `destinationChainId`: relay destination chain ID
      - `depositor`: wallet address that made the deposit on the origin chain
      - `recipient`: recipient wallet address on the destination chain
      - `isSlowRelay`: boolean value indicating whether the relay was a slow relay

## Configuring the token amount thresholds for specific chains

In order to change the token amount thresholds, please add/remove the token addresses in the `./src/chainThresholds.ts` file or change the thresholds amounts for specific chains. Please note that the currently added tokens and corresponding amounts are tentative.

## Test Data

The bot behaviour can be verified with the following transactions by running `npm run tx <TX_HASH>`:

### Ethereum Mainnet
- [0x51fa8f3cabfe44033bfd4729a60eb6d8c57c54a3097463207e33e218b9a91d35](https://etherscan.io/tx/0x51fa8f3cabfe44033bfd4729a60eb6d8c57c54a3097463207e33e218b9a91d35) (1 finding - `FilledRelay` was emitted 1 time with an amount of 3.87 WETH relayed)
- [0x396c794b8a41e6e365a0fc52235739c6e82751b977d3f803d622c9463713e1d9](https://etherscan.io/tx/0x396c794b8a41e6e365a0fc52235739c6e82751b977d3f803d622c9463713e1d9) (2 findings - `FilledRelay` was emitted 2 times with different parameters)

 ### Goerli Testnet (PoC)

In order to verify the Proof of Concept transactions on Goerli the appropriate `jsonRpcUrl` shall be set in `./forta.config.json`

- [0x303eb0de6ee501217858ed30b9d708101dfe0d4f19024adf7c0267c33f89ee4d](https://goerli.etherscan.io/tx/0x303eb0de6ee501217858ed30b9d708101dfe0d4f19024adf7c0267c33f89ee4d) (1 finding - `FilledRelay` was emitted 1 time with an amount of 2 Goerli WETH relayed)
