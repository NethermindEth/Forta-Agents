import { AxiosRequestConfig } from "axios";
import { providers, BigNumber } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";
import ganache from "ganache";

const getGraphQuery = (vault: string) => {
  return {
    query: `
    {
     accountVaultPositions (orderBy:balancePosition, orderDirection:desc, first:10, where: {vault_in: ["${vault}"] } ){
      id, account{
        id
      },
      balancePosition,
      balanceShares,
      vault{
        id
      }
    }
  }`,
  };
};

export const makeRequestOptions = (vault: string): AxiosRequestConfig => {
  return {
    method: "POST",
    url: "https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-mainnet",
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify(getGraphQuery(vault)),
  };
};

export const createFinding = (
  vault: string,
  totalSupply: BigNumber,
  investorsShares: BigNumber,
  sharesWithdrawn: BigNumber
): Finding => {
  const percentAbleToWithdrawn = sharesWithdrawn.mul(100).div(totalSupply);
  return Finding.fromObject({
    name: "Minimun Withdrawable Shares",
    description: "Data about withdrawable shares from a yearn vault",
    alertId: "YEARN-7",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Yearn Finance",
    metadata: {
      vault: vault,
      totalSupply: totalSupply.toString(),
      sharesOwnedByTop10: investorsShares.toString(),
      shareAvailableToWithdrawByTop10: sharesWithdrawn.toString(),
      minPercentAvailableToWithdrawn: percentAbleToWithdrawn.toString(),
    },
  });
};

export const getForkProvider = (
  forkBlockNumber: number,
  unlockedAddresses: string[]
): providers.Web3Provider => {
  return new providers.Web3Provider(
    ganache.provider({
      fork: { network: "mainnet", blockNumber: forkBlockNumber },
      wallet: { unlockedAccounts: unlockedAddresses },
      logging: { quiet: true },
    }) as any
  );
};
