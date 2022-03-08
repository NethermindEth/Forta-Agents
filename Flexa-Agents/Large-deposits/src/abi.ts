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
  
  const FLEXA_TOKEN = [
    "function partitions(bytes32 partition) view returns (bool isPartition)",
  ];
  
  export default {
    FLEXA_TOKEN,
    AMP_TOKEN,
  };
