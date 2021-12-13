export const withdrawAbi = [
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "maxShares", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "maxLoss", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "arg0", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];
