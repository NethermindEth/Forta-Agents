# Large relayer tokens balance change detection bot

## Description

This bot monitors large changes in token balances of major relayers for the [Across v2 bridge](https://across.to/) - a multichain bridge built on the [UMA protocol](https://umaproject.org/) as its source of on-chain data validation. For more details refer [here](https://discourse.umaproject.org/t/forta-monitors-across-v2-request-for-proposals/1569).

## Supported Chains
- Mainnet
- Optimism
- Arbitrum
- Polygon
  
## Alerts

- UMA-9
  - Fired whenever a `Transfer` event is emitted with a large amount (more than the threshold) of monitored token transferred from/to a monitored wallet address
  - Severity is always set to "low" 
  - Type is always set to "info"
  - Metadata :
      - `amount`: amount of tokens transferred
      - `walletAddr`: the monitored relayer address involved in the transfer
      - `tokenAddr`: the address of the transferred token
      - `fundsIn` : boolean value indicating whether the funds from the transfer went in or out of the monitored wallet address

## Configuring the monitored wallet addresses list

The list of monitored wallet addresses/token contract addresses/chain specific thresholds can be changed in `./src/configurables.ts`. 

## Test Data

The bot behaviour can be verified with the following transactions by running `npm run tx <TX_HASH>`:

### Ethereum Mainnet
- [0x234bb58e0b4cb18d1fb55a4fea208d57bc96851ebdff39317abbe8ef95aeafde](https:/etherscan.io/tx/0x234bb58e0b4cb18d1fb55a4fea208d57bc96851ebdff39317abbe8ef95aeafde) (1 finding - the monitored address sent a large amount (more than threshold) of USDC and `Transfer` was emitted)
- [0x33ad4130b4f9c9c18ba09672c9c7e64fe623c715b6b4d48b3fb8f2f690be3003](https://etherscan.io/tx/0x33ad4130b4f9c9c18ba09672c9c7e64fe623c715b6b4d48b3fb8f2f690be3003) (1 finding - the monitored address sent a large amount (more than threshold) of USDC and `Transfer` was emitted)

 ### Goerli Testnet (PoC)

In order to verify the Proof of Concept transactions on Goerli the appropriate `jsonRpcUrl` shall be set in `./forta.config.json`

- [0x8fd340400e8182d4ba10b3f8b6eff1e9a7506e3d24fa34f130b42e0434d36ee5](https://goerli.etherscan.io/tx/0x8fd340400e8182d4ba10b3f8b6eff1e9a7506e3d24fa34f130b42e0434d36ee5) (1 finding - the monitored address sent a large amount (more than threshold) of monitored tokens and `Transfer` was emitted)
- [0x6eb8f040d27dae1c2e76f95637f4835d2cfbd81f71f786869fe184d42332254d](https://goerli.etherscan.io/tx/0x6eb8f040d27dae1c2e76f95637f4835d2cfbd81f71f786869fe184d42332254d) (1 finding - the monitored address received a large amount (more than threshold) of monitored tokens and `Transfer` was emitted)