const AMP_TOKEN = [
  `event TransferByPartition(
    bytes32 indexed fromPartition,
    address operator, 
    address indexed from,
    address indexed to,
    uint256 value,
    bytes data, 
    bytes operatorData
  )`,
];
  
const COLLATERAL_MANAGER = [
  "function partitions(bytes32) view returns (bool)",
];

const CHAINLINK_AMP_DATA_FEED =
  "0x8797ABc4641dE76342b8acE9C63e3301DC35e3d8";

const PRICE_ABI = [
  `function latestRoundData() view returns (
    uint80 roundId, 
    int256 answer, 
    uint256 startedAt, 
    uint256 updatedAt, 
    uint80 answeredInRound
  )`,
];

export default {
  COLLATERAL_MANAGER,
  AMP_TOKEN,
  CHAINLINK_AMP_DATA_FEED,
  PRICE_ABI
};