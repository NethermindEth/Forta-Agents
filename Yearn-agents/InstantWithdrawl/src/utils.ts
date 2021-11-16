export const getAccounts = async (axios: any) => {
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
  return res.data.accountVaultPositions;
};

export function generateReceipt(status: string | number) {
  return {
    status,
    data: {
      blockHash: "0x",
      blockNumber: 665,
      contractAddress: null,
      cumulativeGasUsed: 68527,
      from: "0x",
      gasUsed: 68527,
      logs: [{}],
      root: "",
      to: "0x",
      transactionHash:
        "0xad62c939b2e865f13c61eebcb221d2c9737955e506b69fb624210d3fd4e0035b",
      transactionIndex: 0,
    },
  };
}
