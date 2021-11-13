import axios from "axios";

export const getAccounts = async () => {
  const query = `{
    accountVaultPositions (orderBy:balancePosition, orderDirection:desc, first:5){
      id, account{
        id
      },
      balancePosition,
      balanceShares,
      vault{
        id
      }
    }
  }`;

  var data = JSON.stringify({
    query,
  });

  var config = {
    method: "post",
    url: "https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-mainnet",
    headers: {
      "Content-Type": "application/json",
    },
    data,
  };

  const res = await axios(config as any);
  return res.data;
};
