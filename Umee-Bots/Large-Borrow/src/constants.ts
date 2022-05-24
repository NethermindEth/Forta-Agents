export const BORROW_ABI =
  "event Borrow(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint256 borrowRateMode, uint256 borrowRate, uint16 indexed referral)";

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
