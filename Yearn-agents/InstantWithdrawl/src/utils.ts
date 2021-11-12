import Web3 from "web3";
import { AbiItem } from "web3-utils";
import axios from "axios";

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

export const getAccounts = async () => {
  const query = `{
    accountVaultPositions (orderBy:balancePosition, orderDirection:desc, first:5){
      id, account{
        id
      },
      balancePosition
    }
  }`;

  var data = JSON.stringify({
    query,
  });

  console.log(data);

  var config = {
    method: "post",
    url: "https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-mainnet",
    headers: {
      "Content-Type": "application/json",
    },
    data,
  };

  axios(config as any)
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
};
