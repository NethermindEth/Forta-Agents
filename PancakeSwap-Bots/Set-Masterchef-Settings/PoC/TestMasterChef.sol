pragma solidity 0.6.12;

interface IMigratorChef {
    function migrate(IBEP20 token) external returns (IBEP20);
}

interface IBEP20 {

}

contract TestMasterChef {
    event setMigrator(IMigratorChef _migrator);
    event dev(address _devaddr);
    event add(uint256 _allocPoint, IBEP20 _lpToken, bool _withUpdate);
    event set(uint256 _pid, uint256 _allocPoint, bool _withUpdate);
    event updateMultiplier(uint256 multiplierNumber);

    bool public paused;
    address public operatorAddress;
    address public adminAddress;
    address public oracleAddress;
    uint256 public treasuryFee;

    constructor(
        address _operatorAddress,
        address _adminAddress,
        address _oracleAddress,
        uint256 _treasuryFee
    ) public {
        paused = false;
        operatorAddress = _operatorAddress;
        adminAddress = _adminAddress;
        oracleAddress = _oracleAddress;
        treasuryFee = _treasuryFee;
    }


}
