import { AbiItem } from "web3-utils";

export const yearnDataProvider = "0x437758D475F70249e03EDa6bE23684aD1FC375F0";

export const helperAbi = [
  "function assetAddresses() view"
]
// export const helperAbi = [
//   {
//     type: "function",
//     name: "assetsAddresses",
//     inputs: [],
//     outputs: [
//       {
//         name: "vaults",
//         type: "address[]",
//       }
//     ]
//   }
// ] as AbiItem[];

export const vaultAbi = [
  "function setManagement(address vault)",
  "function governance() view returns(address)"
]
// export const vaultAbi = [
//   {
//     type: "function",
//     name: "setManagement",
//     inputs: [
//       {
//         name: "",
//         type: "address"
//       }
//     ],
//   },
//   {
//     type: "function",
//     name: "governance",
//     inputs: [],
//     outputs: [
//       {
//         type: "address",
//         name: "governance",
//       }
//     ],
//   },
// ] as AbiItem[];
