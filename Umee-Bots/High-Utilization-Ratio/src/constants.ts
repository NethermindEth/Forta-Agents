export const GET_RESERVES_LIST_ABI = "function getReservesList() external view returns (address[] memory)";

export const RESERVE_INITIALIZED_ABI =
  "event ReserveInitialized(address indexed asset, address indexed uToken, address stableDebtToken, address variableDebtToken, address interestRateStrategyAddress)";

export const TOTAL_SUPPLY_ABI = "function totalSupply() public view returns (uint256)";

export const AGGREGATE_ABI =
  "function aggregate(tuple(address target, bytes callData)[] memory calls) public returns (uint256 blockNumber, bytes[] memory returnData)";

export const GET_RESERVE_DATA_ABI = {
  inputs: [
    {
      internalType: "address",
      name: "asset",
      type: "address",
    },
  ],
  name: "getReserveData",
  outputs: [
    {
      components: [
        {
          components: [
            {
              internalType: "uint256",
              name: "data",
              type: "uint256",
            },
          ],
          internalType: "struct DataTypes.ReserveConfigurationMap",
          name: "configuration",
          type: "tuple",
        },
        {
          internalType: "uint128",
          name: "liquidityIndex",
          type: "uint128",
        },
        {
          internalType: "uint128",
          name: "variableBorrowIndex",
          type: "uint128",
        },
        {
          internalType: "uint128",
          name: "currentLiquidityRate",
          type: "uint128",
        },
        {
          internalType: "uint128",
          name: "currentVariableBorrowRate",
          type: "uint128",
        },
        {
          internalType: "uint128",
          name: "currentStableBorrowRate",
          type: "uint128",
        },
        {
          internalType: "uint40",
          name: "lastUpdateTimestamp",
          type: "uint40",
        },
        {
          internalType: "address",
          name: "uTokenAddress",
          type: "address",
        },
        {
          internalType: "address",
          name: "stableDebtTokenAddress",
          type: "address",
        },
        {
          internalType: "address",
          name: "variableDebtTokenAddress",
          type: "address",
        },
        {
          internalType: "address",
          name: "interestRateStrategyAddress",
          type: "address",
        },
        {
          internalType: "uint8",
          name: "id",
          type: "uint8",
        },
      ],
      internalType: "struct DataTypes.ReserveData",
      name: "",
      type: "tuple",
    },
  ],
  stateMutability: "view",
  type: "function",
};

export const BALANCE_OF_ABI = {
  inputs: [
    {
      internalType: "address",
      name: "account",
      type: "address",
    },
  ],
  name: "balanceOf",
  outputs: [
    {
      internalType: "uint256",
      name: "",
      type: "uint256",
    },
  ],
  stateMutability: "view",
  type: "function",
};
