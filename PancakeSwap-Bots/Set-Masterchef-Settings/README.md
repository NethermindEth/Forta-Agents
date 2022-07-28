# Set Masterchef Settings bot

## Description

This bot detects the following Masterchef function calls: 

- `function setMigrator(IMigratorChef _migrator)`
- `function dev(address _devaddr)`
- `function add(uint256 _allocPoint, IBEP20 _lpToken, bool _withUpdate)`
- `function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate)`
- `function updateMultiplier(uint256 multiplierNumber)`

## Supported Chains

- BNB Smart Chain
 
## Alerts

- CAKE-5-1

	- Fired when a transaction contains a `setMigrator` function call.
	- Severity is always set to "Info".
	- Type is always set to "Info".
	- Metadata contains:
		- `_migrator`:  new migrator address
		
- CAKE-5-2

	- Fired when a transaction contains a `dev` function call.
	- Severity is always set to "Info".
	- Type is always set to "Info".
	- Metadata contains:
		- `_devaddr`:  new dev address 
		
- CAKE-5-3

	- Fired when a transaction contains a `add` function call.
	- Severity is always set to "Info".
	- Type is always set to "Info".
	- Metadata contains:
		- `_allocPoint`:  value to increment by 
		- `_lpToken`:  new lpToken address
		- `_withUpdate`:  function withUpdate invoked if true

	
- CAKE-5-4

	- Fired when a transaction contains a `set` function call.
	- Severity is always set to "Info". 
	- Type is always set to "Info".
	- Metadata contains:
		- `_pid`:  pool id 
		- `_allocPoint`: value to increment by
		- `_withUpdate`: function withUpdate invoked if true 
		
- CAKE-5-5

	- Fired when a transaction contains a `updateMultiplier` function call.
	- Severity is always set to "Info".
	- Type is always set to "Info".
	- Metadata contains:
		- `multiplierNumber`:  new multiplier number
		
		
## Test Data

The bot behaviour can be verified with the following testnet transactions:

[0xd111537a2d8ab1f5c13f14e5ef55bdbeb3711d745b4518653e73b8ca05593100](https://testnet.bscscan.com/tx/0xd111537a2d8ab1f5c13f14e5ef55bdbeb3711d745b4518653e73b8ca05593100)(expect 1 finding: setMigrator)
[0xf58dadc470052f0852b5487d28c999f5206943ee313d339a4223bc371ac284e5](https://testnet.bscscan.com/tx/0xf58dadc470052f0852b5487d28c999f5206943ee313d339a4223bc371ac284e5)(expect 1 finding: dev)
[0x2eb9b72b659954ffd45c832163b3bfa31fe806bb673d9c99e79d68ca33b8a002](https://testnet.bscscan.com/tx/0x2eb9b72b659954ffd45c832163b3bfa31fe806bb673d9c99e79d68ca33b8a002)(expect 1 finding: add)
[0x75c7611b71466ff55c5bcbc8835def7250e04b0285eed27b9b43b68f2acfd444](https://testnet.bscscan.com/tx/0x75c7611b71466ff55c5bcbc8835def7250e04b0285eed27b9b43b68f2acfd444)(expect 1 finding: set)
[0xfd5d3cd1d53eb1486429780395fe14774a3487b9aeee8fbdafba0623c3931cf1](https://testnet.bscscan.com/tx/0xfd5d3cd1d53eb1486429780395fe14774a3487b9aeee8fbdafba0623c3931cf1)(expect 1 finding: updateMultiplier)