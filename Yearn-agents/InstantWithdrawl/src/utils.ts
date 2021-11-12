import { ApolloClient, gql } from "@apollo/client";
import Web3 from "web3";
import { AbiItem } from "web3-utils";

export const yearnDataProvider = "0x437758D475F70249e03EDa6bE23684aD1FC375F0";
export const helperAbi = [
  {
    type: "function",
    name: "assetsAddresses",
    inputs: [],
    outputs: [
      {
        name: "vaults",
        type: "address[]",
      },
    ],
  },
] as AbiItem[];

export const getYearnVaults = async (
  web3: Web3,
  blockNumber: string | number
): Promise<string[]> => {
  const yearnHelper = new web3.eth.Contract(helperAbi, yearnDataProvider);
  return yearnHelper.methods.assetsAddresses().call({}, blockNumber);
};

// export const getTopLiquidityBalanceAccounts = async () {
//   const yearnQueryUrl = "";

//   //  {
//   //   accountVaultPositions(first: 5, orderDirection: desc, orderBy: balanceShares) {
//   //     id,
//   //     balancePosition
//   //   }
//   // }
//   const query = `
//     query {
//       accountVaultPositions  {
//         id,
//         balancePosition
//       }
//     }
//   `
// }
