// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IMigratorChef {
    function migrate(IBEP20 token) external returns (IBEP20);
}

interface IBEP20 {

}

contract TestMasterChef {

    uint256 public x = 0; 

    IMigratorChef public migrator; 
    address public devaddr; 
    uint256 public BONUS_MULTIPLIER = 0; 
    
    function setMigrator(IMigratorChef _migrator) public {
        migrator = _migrator;
    }

    function dev(address _devaddr) public {
        devaddr = _devaddr;
    }   

    function add(uint256 _allocPoint, IBEP20 _lpToken, bool _withUpdate) public {
        x = x+_allocPoint; 
    }

    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public {
        x = _pid;
    }
    function updateMultiplier(uint256 multiplierNumber) public {
        BONUS_MULTIPLIER = multiplierNumber;
    }
}
