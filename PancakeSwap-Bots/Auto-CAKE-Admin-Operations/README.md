
# CAKE Admin Operations Agent

## Description

This agent detects the following PancakeSwap Admin/Operator event emissions:

- `Pause` event
- `Unpause` event 
- `NewOperatorAddress` event
- `NewAdminAddress` event
- `NewOracle` event 
- `NewTreasuryFee` event 

## Supported Chains

- BSC
 
## Alerts

- CAKE-9-1

	- Fired when a transaction contains a `Pause` event is detected.

	- Severity is always set to "info" 

	- Type is always set to "info"

	- Metadata contains:
		- `time`:  epoch containing this transaction 
		
- CAKE-9-2

	- Fired when a transaction contains a `Unpause` event is detected.

	- Severity is always set to "info" 

	- Type is always set to "info"

	- Metadata contains:
		- `time`:  uint256 epoch 
		
- CAKE-9-3

	- Fired when a transaction contains a `NewOperatorAddress` event is detected.

	- Severity is always set to "info" 

	- Type is always set to "info"

	- Metadata contains:
		- `address`:  address of new operator  
	
- CAKE-9-4

	- Fired when a transaction contains a `NewAdminAddress` event is detected.

	- Severity is always set to "info" 

	- Type is always set to "info"

	- Metadata contains:
		- `address`:  address of new admin
		
  - CAKE-9-5

	- Fired when a transaction contains a `NewOracle` event is detected.

	- Severity is always set to "info" 

	- Type is always set to "info"

	- Metadata contains:
		- `address`:  address of new admin
		
  - CAKE-9-6

	- Fired when a transaction contains a `NewTreasuryFee` event is detected.

	- Severity is always set to "info" 

	- Type is always set to "info"

	- Metadata contains:
		- `time`:  epoch containing this transaction 
		- `fee`: new treasury fee
		
## Test Data


The agent behaviour can be verified with the following transactions:

- 0x06e89e74da68cb92338ba18d15504922530d391b34ac11271d2d5cd280129d58 (expect 1 finding: `Pause`)
- 0x4aa95c3413fa808db1cdb1b673cf875aa190f8d0dcb94a9db4ae55e244bdc547 (expect 1 finding: `Unpause`)
- 0x2d6524aa10ea6f924a5c29a38f45515254bdb692545c5eb9cb3a7f6a9f36da72 (expect 1 finding: `NewAdminAddress`)