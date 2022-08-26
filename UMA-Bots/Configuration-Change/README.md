# HubPool and SpokePool configuration change detection bot

## Description

This bot detects configuration changes of the HubPool and SpokePool contracts for  [Across v2 Protocol](https://across.to/) - a multichain bridge which uses [UMA](https://umaproject.org/) as its source of on-chain data and validation. For more details refer [here](https://discourse.umaproject.org/t/forta-monitors-across-v2-request-for-proposals/1569).

## Supported Chains
- Mainnet
  
## Alerts

- UMA-3
  - Fired when a dispute occurs on the receiving chain
  - Severity is always set to "medium" 
  - Type is always set to "suspicious"
  - Metadata :
      - `disputer`: the disputer - address which raised a dispute
      - `requestTime` : timestamp of the request made
  
## Test Data

These tests can be run using npm run tx <TX_HASH> :

### Ethereum Mainnet

The agent behaviour can be verified with the following transactions by running `npm run tx <TX_HASH>`:
- [0xebff6f85c589c4fb493f24560b007a0c1a2c9be0e930c548ca8dd10adbbe504a](https://etherscan.io/tx/0xebff6f85c589c4fb493f24560b007a0c1a2c9be0e930c548ca8dd10adbbe504a) (1 finding - `BondSet` was emitted by the `HubPool` contract)
- [0x35e9ebe1585c2ff4c10a91f2060ee7ec1bd6af5568ff16e45256c62904b27d17](https://etherscan.io/tx/0x35e9ebe1585c2ff4c10a91f2060ee7ec1bd6af5568ff16e45256c62904b27d17) (2 findings - `SetXDomainAdmin` and `SetHubPool` were emitted by the `SpokePool` contract) 

 ### Goerli Testnet (PoC)

In order to verify the Proof of Concept transactions on Goerli the appropriate `jsonRpcUrl` shall be set in `./forta.config.json`

- [0xf5edfdd0903d084844d469d6ac31021b33c9b5b239c48743cad25c34c310d572](https://goerli.etherscan.io/tx/0xf5edfdd0903d084844d469d6ac31021b33c9b5b239c48743cad25c34c310d572) (1 finding - `LivenessSet` was emitted by the `HubPool` contract)
- [0x55cd4799aa03301a054fcc3b4376aa24ec2667595adf0351b6c1d65ff2658c5c](https://goerli.etherscan.io/tx/0x55cd4799aa03301a054fcc3b4376aa24ec2667595adf0351b6c1d65ff2658c5c) (1 findings - `SetXDomainAdmin` was emitted by the `SpokePool` contract)
- [0xcf399a781619d2375d10d71514f55cbf25153e966a1b9c998067e70dc9880473](https://goerli.etherscan.io/tx/0xcf399a781619d2375d10d71514f55cbf25153e966a1b9c998067e70dc9880473) (2 findings - `LivenessSet` was emitted by the `HubPool` contract and `SetXDomainAdmin` was emitted by the `SpokePool` contract)