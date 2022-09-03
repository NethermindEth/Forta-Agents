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
  - Fired whenever a `Transfer` event is emitted with a large amount (more than the threshold) of moniotred token transfer from a monitored wallet address
  - Severity is always set to "low" 
  - Type is always set to "info"
  - Metadata :
      - `amount`: amount of tokens transferred
      - `addr` : the monitored address involved in the transfer
      - `fundsIn` : boolean value indicating whether the funds from the transfer went in or out of the monitored wallet address

## Configuring the monitored wallet addresses list

The list of monitored wallet addresses/token contract addresses/chain specific thresholds can be changed in `./src/configurables.ts`. 

## Test Data

The bot behaviour can be verified with the following transactions by running `npm run tx <TX_HASH>`:

### Ethereum Mainnet
<!-- - [0xd04843daf4c52cac0e522fa3b2fd6cac3c14ced163c0576f31095d70b1756acd](https://etherscan.io/tx/0xd04843daf4c52cac0e522fa3b2fd6cac3c14ced163c0576f31095d70b1756acd) (2 findings - `FilledRelay` was emitted 3 times, out of which 2 had monitored wallet addresses as depositors)
- [0xf09b60c2f3dd17b9444cb266dc773839c85edb0fcf315ea273f2b2acec267372](https://etherscan.io/tx/0xf09b60c2f3dd17b9444cb266dc773839c85edb0fcf315ea273f2b2acec267372) (2 findings - `FilledRelay` was emitted 2 times with the same monitored wallet address acting as the depositor) -->

 ### Goerli Testnet (PoC)

In order to verify the Proof of Concept transactions on Goerli the appropriate `jsonRpcUrl` shall be set in `./forta.config.json`

- [0xff0508a95c612eba2e21771ff4332c821f238a71c31fdc47a7e857486222a528](https://goerli.etherscan.io/tx/0xff0508a95c612eba2e21771ff4332c821f238a71c31fdc47a7e857486222a528) (1 finding - the monitored address sent a large amount (more than threshold) of monitored tokens and `Transfer` was emitted)
- [0x63fa57b8f3bbb9105daebd444177dc60799da648634a1538bfc048e492ba8063](https://goerli.etherscan.io/tx/0x63fa57b8f3bbb9105daebd444177dc60799da648634a1538bfc048e492ba8063) (1 finding - the monitored address received a large amount (more than threshold) of monitored tokens and `Transfer` was emitted)