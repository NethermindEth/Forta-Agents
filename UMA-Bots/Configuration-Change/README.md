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
<!-- - [0x10e5c318414dccbc2172ce624afd0a4ae46fa538ef6b21522f2e87991f621e60](https://etherscan.io/tx/0x10e5c318414dccbc2172ce624afd0a4ae46fa538ef6b21522f2e87991f621e60) (1 finding - `RootBundleDisputed` was emitted)
- [0x312985c7e8a363079c3ae416f8e30a3caa4d4ddee61ac9c2c07f2a637655916d](https://etherscan.io/tx/0x312985c7e8a363079c3ae416f8e30a3caa4d4ddee61ac9c2c07f2a637655916d) (2 findings - `RootBundleDisputed` was emitted 2 times with different parameters)  -->

 ### Goerli Testnet (PoC)

In order to verify the Proof of Concept transactions on Goerli the appropriate `jsonRpcUrl` shall be set in `./forta.config.json`

- [0xf5edfdd0903d084844d469d6ac31021b33c9b5b239c48743cad25c34c310d572](https://goerli.etherscan.io/tx/0xf5edfdd0903d084844d469d6ac31021b33c9b5b239c48743cad25c34c310d572) (1 finding - `LivenessSet` was emitted by the `HubPool` contract)
- [0x55cd4799aa03301a054fcc3b4376aa24ec2667595adf0351b6c1d65ff2658c5c](https://goerli.etherscan.io/tx/0x55cd4799aa03301a054fcc3b4376aa24ec2667595adf0351b6c1d65ff2658c5c) (1 findings - `SetXDomainAdmin` was emitted by the `SpokePool` contract)
- [0xcf399a781619d2375d10d71514f55cbf25153e966a1b9c998067e70dc9880473](https://goerli.etherscan.io/tx/0xcf399a781619d2375d10d71514f55cbf25153e966a1b9c998067e70dc9880473) (2 findings - `LivenessSet` was emitted by the `HubPool` contract and `SetXDomainAdmin` was emitted by the `SpokePool` contract)