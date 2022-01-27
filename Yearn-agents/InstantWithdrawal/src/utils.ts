import axios, { AxiosRequestConfig } from "axios";
import { vaultRegistryInterface, vaultInterface } from "./abi";
import { providers, BigNumber, Contract } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";
import ganache from "ganache-core";

type ForkFactory = (
  jsonRpcURL: string,
  block: number,
  unlockedAccounts: string[]
) => providers.Web3Provider;

type InvestorInfo = {
  vault: {
    id: string;
  };

  account: {
    id: string;
  };
};

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

const makeRequestOptions = (vault: string): AxiosRequestConfig => {
  return {
    method: "POST",
    url: "https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-mainnet",
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify(getGraphQuery(vault)),
  };
};

export const getBiggerInvestors = async (
  vault: string
): Promise<InvestorInfo[]> => {
  const data = (await axios(makeRequestOptions(vault.toLowerCase()))) as any;
  return data.data.data.accountVaultPositions;
};

export const getVaults = async (
  vaultRegistryAddress: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<string[]> => {
  const vaultRegistryContract = new Contract(
    vaultRegistryAddress,
    vaultRegistryInterface,
    provider
  );
  return vaultRegistryContract.assetsAddresses({ blockTag: blockNumber });
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
  jsonRpcURL: string,
  forkBlockNumber: number,
  unlockedAddresses: string[]
): providers.Web3Provider => {
  return new providers.Web3Provider(
    ganache.provider({
      fork: jsonRpcURL,
      fork_block_number: forkBlockNumber,
      unlocked_accounts: unlockedAddresses,
    }) as any
  );
};

const withdrawForUser = async (
  investorInfo: InvestorInfo,
  balanceBefore: BigNumber,
  forkProvider: providers.Web3Provider
): Promise<BigNumber> => {
  const vaultAddress = investorInfo.vault.id;
  const investor = investorInfo.account.id;

  const vaultContract = new Contract(
    vaultAddress,
    vaultInterface,
    forkProvider.getSigner(investor)
  );

  try {
    await vaultContract.withdraw(balanceBefore);
  } catch {}

  const balanceAfter = await vaultContract.balanceOf(investor);

  return balanceBefore.sub(balanceAfter);
};

export const getStatsForVault = async (
  topInvestors: InvestorInfo[],
  jsonRpcURL: string,
  blockNumber: number,
  createFork: ForkFactory
): Promise<[string, BigNumber, BigNumber, BigNumber]> => {
  const investors = topInvestors.map((investor) => investor.account.id);
  const forkProvider = createFork(jsonRpcURL, blockNumber, investors);

  const vault = topInvestors[0].vault.id;
  const vaultContract = new Contract(vault, vaultInterface, forkProvider);

  const totalSupply = await vaultContract.totalSupply();
  const balancesPromises = investors.map((investor) =>
    vaultContract.balanceOf(investor)
  );
  const balances = await Promise.all(balancesPromises);

  const totalInvestorValues = balances.reduce((acum, value) => acum.add(value));

  let ableToWithdrawn = BigNumber.from(0);
  for (let i = 0; i < topInvestors.length; i++) {
    const withdrawnByInvestor = await withdrawForUser(
      topInvestors[i],
      balances[i],
      forkProvider
    );
    ableToWithdrawn = ableToWithdrawn.add(withdrawnByInvestor);
  }

  return [vault, totalSupply, totalInvestorValues, ableToWithdrawn];
};
