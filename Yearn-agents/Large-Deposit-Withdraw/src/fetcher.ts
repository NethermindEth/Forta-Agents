import abi from './abi';
import LRU from 'lru-cache';
import BigNumber from 'bignumber.js';

type BlockId = string | number; 
type CacheValues = string[] | BigNumber;

export default class DataFetcher {
  private cache: LRU<string, CacheValues>;
  private web3: any;

  constructor(web3: any) {
    this.cache = new LRU<string, CacheValues>({max: 10_000});
    this.web3 = web3;
  }

  public async getVaults(provider: string, block: BlockId = "latest"): Promise<string[]> {
    const cacheKey: string = `${block}-${provider}-1`;
    if(block !== "latest" && this.cache.get(cacheKey) !== undefined)
      return this.cache.get(cacheKey) as string[];
    
    const providerContract = new this.web3.eth.Contract(abi.PROVIDER, provider);

    const vaults: string[] = await providerContract.methods
      .assetsAddresses()
      .call({}, block);
    const vaultsInLower: string[] = vaults.map((v: string) => v.toLowerCase());
    this.cache.set(cacheKey, vaultsInLower);
    return vaultsInLower;
  } 

  public async getMaxDeposit(vault: string, block: BlockId = "latest"): Promise<BigNumber> {
    const cacheKey: string = `${block}-${vault}-2`;
    if(block !== "latest" && this.cache.get(cacheKey) !== undefined)
      return this.cache.get(cacheKey) as BigNumber;

    const vaultContract = new this.web3.eth.Contract(abi.VAULT, vault);
  
    const [
      depositLimit,
      token,
      debt,
    ] = await Promise.all([
      vaultContract.methods.depositLimit().call({}, block),
      vaultContract.methods.token().call({}, block),
      vaultContract.methods.totalDebt().call({}, block),
    ]);

    const tokenContract = new this.web3.eth.Contract(abi.TOKEN, token);    

    const balance: BigNumber = new BigNumber(
      await tokenContract.methods
        .balanceOf(vault)
        .call({}, block)
    );

    const maxDeposit: BigNumber = (new BigNumber(depositLimit)).minus(balance).minus(new BigNumber(debt));
    this.cache.set(cacheKey, maxDeposit);
    return maxDeposit;
  }

  public async getMaxWithdraw(vault: string, block: BlockId = "latest"): Promise<BigNumber> {
    const cacheKey: string = `${block}-${vault}-3`;
    if(block !== "latest" && this.cache.get(cacheKey) !== undefined)
      return this.cache.get(cacheKey) as BigNumber;

    const vaultContract = new this.web3.eth.Contract(abi.VAULT, vault);
  
    const supply: BigNumber = new BigNumber(
      await vaultContract.methods
        .totalSupply()
        .call({}, block)
    );

    this.cache.set(cacheKey, supply);
    return supply;
  }
};
