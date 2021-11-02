import Web3 from 'web3';
import LRU from 'lru-cache';
import { isZeroAddress } from 'ethereumjs-util';
import { HelperABI, StrategyABI, VaultABI } from './abi';

type vaultAddress = string;
type strategies = string[];

const HELPER = '0x437758D475F70249e03EDa6bE23684aD1FC375F0';

export default class MakerFetcher {
  private cache: LRU<vaultAddress, strategies>;
  private web3: Web3;

  constructor(web3: Web3) {
    this.cache = new LRU<vaultAddress, strategies>({ max: 10_000 });
    this.web3 = web3;
  }

  private getAssets = async (
    blockNumber: string | number
  ): Promise<string[]> => {
    const helperContract = new this.web3.eth.Contract(HelperABI, HELPER);

    const assets: string[] = await helperContract.methods
      .assetsAddresses()
      .call({}, blockNumber);

    return assets;
  };

  public getVaults = async (blockNumber: string | number) => {
    const vaults: string[] = await this.getAssets(blockNumber);

    vaults.forEach(async (vault) => {
      const strategies = await this.getStrategies(vault, blockNumber);
      console.log(this.cache.get(vault));
      strategies.map(async (strategy) => {
        await this.filterInActives(vault, strategy, blockNumber);
      });
    });

    return vaults;
  };

  private getStrategies = async (
    vault: string,
    blockNumber: string | number
  ): Promise<string[]> => {
    const strategies: string[] = [];
    const vaultContract = new this.web3.eth.Contract(VaultABI, vault);

    let counter = 0;
    let isDone = false;
    while (!isDone) {
      const strategy = await vaultContract.methods
        .withdrawalQueue(counter)
        .call({}, blockNumber);

      if (!isZeroAddress(strategy)) {
        strategies.push(strategy);
        counter++;
      } else {
        isDone = true;
      }
    }

    return strategies;
  };

  private filterInActives = async (
    vault: string,
    strategy: string,
    blockNumber: string | number
  ) => {
    if (!this.cache.get(vault)?.includes(strategy)) {
      const strategyContract = new this.web3.eth.Contract(
        StrategyABI,
        strategy
      );

      const isActive = await strategyContract.methods
        .isActive()
        .call({}, blockNumber);

      if (!isActive) {
        const inActives = this.cache.get(vault);

        if (inActives !== undefined) {
          inActives.push(strategy);
          this.cache.set(vault, inActives);
        } else {
          this.cache.set(vault, [strategy]);
        }
      }
    }
  };
}
