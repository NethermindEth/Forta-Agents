const REGISTRY: string[] = [
  `event UpkeepPerformed(
    uint256 indexed id,
    bool indexed success,
    address indexed from,
    uint96 payment,
    bytes performData
  )`,
  `function getUpkeep(uint256 id) view returns (
    address target,
    uint32 executeGas,
    bytes checkData,
    uint96 balance,
    address lastKeeper,
    address admin,
    uint64 maxValidBlocknumber
  )`,
];

const STRATEGIES_MANAGMENT: string[] = [
  "function addStrategy(address _address)",
  "function removeStrategy(address _address)",
];

const KEEPER: string[] = [
  "function strategyArray(uint256 index) view returns (address strat)",
  ...STRATEGIES_MANAGMENT,
];

export default {
  REGISTRY,
  KEEPER,
  STRATEGIES_MANAGMENT,
};
