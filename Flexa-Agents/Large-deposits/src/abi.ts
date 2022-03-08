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
  
const FLEXA_CONTRACT = [
  "function partitions(bytes32) view returns (bool)",
];
  
export default {
  FLEXA_CONTRACT,
  AMP_TOKEN,
};