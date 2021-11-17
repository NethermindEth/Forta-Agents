import { Finding, FindingSeverity, FindingType } from "forta-agent";

import { BigNumber } from "bignumber.js";

export type UserDetails = {
  account: string;
  balance: BigNumber;
};
export type Mapping = {
  [key: string]: Array<UserDetails>;
};

export const getAccounts = async (axios: any) => {
  const query = `{
    accountVaultPositions (orderBy:balancePosition, orderDirection:desc, first:150){
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
  const positions = res.data.data.accountVaultPositions;
  const mapping: Mapping = {};
  const users = new Set();

  positions.forEach((value: any) => {
    const address: string = value.vault.id;
    const values = mapping[address] || [];
    values.push({
      account: value.account.id,
      balance: new BigNumber(value.balanceShares),
    });
    users.add(address);
    mapping[address] = values;
  });
  return { mapping, users };
};

export function generateFinding(
  balance: string,
  index: number,
  vaultAddress: string
) {
  return Finding.fromObject({
    name: "Yearn-agent-7",
    description: `The ${index} account wasn't able to make the withdraw on vault ${vaultAddress}`,
    severity: FindingSeverity.Info,
    type: FindingType.Unknown,
    alertId: "Yearn-agent-7",
    metadata: {
      balance,
    },
  });
}
