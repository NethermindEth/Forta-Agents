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
  
export default {
  COLLATERAL_MANAGER,
  AMP_TOKEN,
};