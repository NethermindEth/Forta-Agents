const CAKE_ABI: string[] = [
    "function setMigrator(address _migrator)",
    "function dev(address _devaddr)",
    "function add(uint256 _allocPoint, address _lpToken, bool _withUpdate)",
    "function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate)",
    "function updateMultiplier(uint256 multiplierNumber)",
  ];

export default {
    CAKE_ABI, 
};