import { providers, Contract, BigNumber } from "ethers"
import { vaultInterface, vaultRegistryInterface } from "./abi";
import { getForkProvider, makeRequestOptions } from "./utils";

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

export default class DataFetcher {
  private provider: providers.Provider;
  private axios: any;

  constructor(provider: providers.Provider, axios: any) {
    this.provider = provider;
    this.axios = axios;
  }

  public async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  public async getVaults(
    vaultRegistryAddress: string,
    blockNumber: number,
  ): Promise<string[]> {
    const vaultRegistryContract = new Contract(
      vaultRegistryAddress,
      vaultRegistryInterface,
      this.provider,
    );
    return vaultRegistryContract
      .assetsAddresses({ blockTag: blockNumber })
      .then((list: string[]) => list.map(e => e.toLowerCase()));
  }

  public async getBiggerInvestors(vault: string): Promise<InvestorInfo[]> {
    const data = (await this.axios(makeRequestOptions(vault.toLowerCase())));
    return data.data.data.accountVaultPositions;
  }

  public async withdrawForUser(
    investorInfo: InvestorInfo,
    balanceBefore: BigNumber,
    forkProvider: providers.Web3Provider
  ): Promise<BigNumber> {
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
  
    const balanceAfter = await vaultContract.balanceOf(investor, {blockTag: "latest"});
  
    return balanceBefore.sub(balanceAfter);
  }

  public async getStatsForVault(
    topInvestors: InvestorInfo[],
    jsonRpcURL: string,
    blockNumber: number,
    createFork: ForkFactory
  ): Promise<[string, BigNumber, BigNumber, BigNumber]> {
    const investors = topInvestors.map((investor) => investor.account.id);
    const forkProvider = createFork(jsonRpcURL, blockNumber, investors);
  
    const vault = topInvestors[0].vault.id;
    const vaultContract = new Contract(vault, vaultInterface, forkProvider);
  
    const totalSupply = await vaultContract.totalSupply({ blockTag: "latest" });
    const balancesPromises = investors.map((investor) =>
      vaultContract.balanceOf(investor, { blockTag: "latest" })
    );
    const balances = await Promise.all(balancesPromises);
  
    const totalInvestorValues = balances.reduce((acum, value) => acum.add(value));
  
    let ableToWithdrawn = BigNumber.from(0);
    for (let i = 0; i < topInvestors.length; i++) {
      const withdrawnByInvestor = await this.withdrawForUser(
        topInvestors[i],
        balances[i],
        forkProvider
      );
      ableToWithdrawn = ableToWithdrawn.add(withdrawnByInvestor);
    }
  
    return [vault, totalSupply, totalInvestorValues, ableToWithdrawn];
  }

  public async getStats(
    registryAddress: string,
    jsonRpcURL: string,
    createFork: ForkFactory = getForkProvider,
  ): Promise<[string, BigNumber, BigNumber, BigNumber][]> {
    const blockNumber = await this.getBlockNumber();
    const vaults = await this.getVaults(registryAddress, blockNumber);

    const investByVaultPromises = vaults.map((vault) =>
      this.getBiggerInvestors(vault)
    );
    let investByVault = await Promise.all(investByVaultPromises);

    investByVault = investByVault.filter(
      (investorsInfo) => investorsInfo.length > 0
    );

    const statsPromises = investByVault.map((investors) =>
      this.getStatsForVault(investors, jsonRpcURL, blockNumber, createFork)
    );

    return Promise.all(statsPromises);
  }
};
