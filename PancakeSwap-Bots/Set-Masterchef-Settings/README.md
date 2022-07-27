# Set Masterchef Settings bot

## Description

This bot detects the following Masterchef function calls: 

- `function setMigrator(IMigratorChef _migrator)`
- `function dev(address _devaddr)`
- `function add(uint256 _allocPoint, IBEP20 _lpToken, bool _withUpdate)`
- `function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate)`
- `function updateMultiplier(uint256 multiplierNumber)`

## Supported Chains

- BSC
 
## Alerts

- CAKE-5-1

	- Fired when a transaction contains a `setMigrator` function call.
	- Severity is always set to "Info".
	- Type is always set to "Info".
	- Metadata contains:
		- `placeholder`:  placeholder 
		
- CAKE-5-2

	- Fired when a transaction contains a `dev` function call.
	- Severity is always set to "Info".
	- Type is always set to "Info".
	- Metadata contains:
		- `placeholder`:  placeholder
		
- CAKE-5-3

	- Fired when a transaction contains a `add` function call.
	- Severity is always set to "Info".
	- Type is always set to "Info".
	- Metadata contains:
		- `placeholder`:  placeholder 
	
- CAKE-5-4

	- Fired when a transaction contains a `set` function call.
	- Severity is always set to "Info". 
	- Type is always set to "Info".
	- Metadata contains:
		- `placeholder`:  placeholder
		
- CAKE-5-5

	- Fired when a transaction contains a `updateMultiplier` function call.
	- Severity is always set to "Info".
	- Type is always set to "Info".
	- Metadata contains:
		- `placeholder`:  placeholder
		
		
## Test Data

The bot behaviour can be verified with the following transactions:

(adding specific tx's later) 
https://testnet.bscscan.com/address/0xbD315DA028B586f7cD93903498e671fA3efeF506