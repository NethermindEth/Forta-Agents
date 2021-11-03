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

  public getActiveMakers = async (blockNumber: string | number) => {
    const activeMakers: string[] = [];
    const vaults = await this.getVaults(blockNumber);

    vaults.forEach(async (vault) => {
      const makers = await this.filterMakerStrategy(vault, blockNumber);

      const actives = makers.filter(async (strategy) => {
        return await this.filterInActives(vault, strategy, blockNumber);
      });

      activeMakers.push(...actives);
    });
    return activeMakers;
  };

  private getVaults = async (
    blockNumber: string | number
  ): Promise<string[]> => {
    const helperContract = new this.web3.eth.Contract(HelperABI, HELPER);

    const vaults: string[] = await helperContract.methods
      .assetsAddresses()
      .call({}, blockNumber);

    return vaults;
  };

  private filterMakerStrategy = async (
    vault: string,
    blockNumber: string | number
  ) => {
    const strategies = await this.getStrategies(vault, blockNumber);

    const makerStrategies = strategies.filter(async (strategy) => {
      const strategyContract = new this.web3.eth.Contract(
        StrategyABI,
        strategy
      );

      const name: string = await strategyContract.methods
        .name()
        .call({}, blockNumber);

      return name.includes('Maker');
    });

    return makerStrategies;
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
  ): Promise<boolean> => {
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
        return false;
      } else return true;
    } else return false;
  };

  /*   private isActive = async (
    vault: string,
    strategy: string
  ): Promise<boolean> => {
    if (this.cache.get(vault)?.includes(strategy)) {
      return false;
    } else return true;
  }; */
}
