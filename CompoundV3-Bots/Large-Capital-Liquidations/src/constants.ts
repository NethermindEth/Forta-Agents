export const COMET_ABI = [
  "event Supply(address indexed from, address indexed dst, uint amount)",
  "event Transfer(address indexed from, address indexed to, uint amount)",
  "event Withdraw(address indexed src, address indexed to, uint amount)",
  "event AbsorbDebt(address indexed absorber, address indexed borrower, uint basePaidOut, uint usdValue)",
  "function isBorrowCollateralized(address account) public view returns (bool)",
  "function baseIndexScale() external pure returns (uint64)",
  "function factorScale() external pure returns (uint64)",
  {
    inputs: [],
    name: "totalsBasic",
    outputs: [
      {
        components: [
          {
            internalType: "uint64",
            name: "baseSupplyIndex",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "baseBorrowIndex",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "trackingSupplyIndex",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "trackingBorrowIndex",
            type: "uint64",
          },
          {
            internalType: "uint104",
            name: "totalSupplyBase",
            type: "uint104",
          },
          {
            internalType: "uint104",
            name: "totalBorrowBase",
            type: "uint104",
          },
          {
            internalType: "uint40",
            name: "lastAccrualTime",
            type: "uint40",
          },
          {
            internalType: "uint8",
            name: "pauseFlags",
            type: "uint8",
          },
        ],
        internalType: "struct CometStorage.TotalsBasic",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "userBasic",
    outputs: [
      {
        internalType: "int104",
        name: "principal",
        type: "int104",
      },
      {
        internalType: "uint64",
        name: "baseTrackingIndex",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "baseTrackingAccrued",
        type: "uint64",
      },
      {
        internalType: "uint16",
        name: "assetsIn",
        type: "uint16",
      },
      {
        internalType: "uint8",
        name: "_reserved",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
