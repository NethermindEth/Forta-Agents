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

const KEEPER: string[] = [
  "function strategyArray(uint256 index) view returns (address strat)",
];

export default {
  REGISTRY,
  KEEPER,
};
