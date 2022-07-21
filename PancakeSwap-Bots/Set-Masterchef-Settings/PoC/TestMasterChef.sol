// pragma solidity 0.6.12;

// contract TestMasterChef {

//     event setMigrator(IMigratorChef _migrator);
//     event dev(address _devaddr);
//     event add(uint256 _allocPoint, IBEP20 _lpToken, bool _withUpdate);
//     event set(uint256 _pid, uint256 _allocPoint, bool _withUpdate);
//     event updateMultiplier(uint256 multiplierNumber);

//     bool public paused; 
//     address public operatorAddress;
//     address public adminAddress;
//     address public oracleAddress;
//     uint256 public treasuryFee; 

//     constructor(
//         address _operatorAddress,
//         address _adminAddress,
//         address _oracleAddress,
//         uint256 _treasuryFee
//     ) {
//         paused = false; 
//         operatorAddress = _operatorAddress;
//         adminAddress = _adminAddress;
//         oracleAddress = _oracleAddress;
//         treasuryFee = _treasuryFee; 
//     }

//     function pause() public {
//         paused = true; 
//         emit Pause(block.timestamp); 
//     }

//     function unpause() public {
//         paused = false; 
//         emit Unpause(block.timestamp); 
//     }

//     function setOperator(address _operatorAddress) public {
//         operatorAddress = _operatorAddress;
//         emit NewOperatorAddress(_operatorAddress);
//     }

//     function setAdminAddress(address _adminAddress) public {
//         adminAddress = _adminAddress;
//         emit NewAdminAddress(_adminAddress);
//     }

//     function setOracle(address _oracleAddress) public {
//         oracleAddress = _oracleAddress; 
//         emit NewOracle(_oracleAddress);
//     }

//     function setTreasuryFee(uint256 _newFee) public {
//         treasuryFee = _newFee; 
//         emit NewTreasuryFee(block.timestamp, _newFee);
//     }

// } 