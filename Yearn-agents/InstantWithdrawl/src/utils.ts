import { Finding, FindingSeverity, FindingType } from "forta-agent";

import axios from "axios";
import { BigNumber } from "bignumber.js";

export type UserDetails = {
  account: string;
  balance: BigNumber;
};
export type Mapping = {
  [key: string]: Array<UserDetails>;
};

export const getAccounts = async () => {
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

  positions.forEach((value: any) => {
    const address: string = value.vault.id;
    const values = mapping[address] || [];
    values.push({
      account: value.account.id,
      balance: new BigNumber(value.balanceShares),
    });
    mapping[address] = values;
  });
  return mapping;
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

export function generateFinding(balance: string) {
  return Finding.fromObject({
    name: "Yearn-agent-7",
    description: "30% of amount couldnt be withdrawn",
    severity: FindingSeverity.Info,
    type: FindingType.Unknown,
    alertId: "Yearn-agent-7",
    metadata: {
      balance,
    },
  });
}
