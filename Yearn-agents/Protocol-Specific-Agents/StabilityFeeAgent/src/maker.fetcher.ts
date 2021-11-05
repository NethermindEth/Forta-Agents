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

  public getActiveMakers = async (blockNumber: string | number = 'latest') => {
    const activeMakers: string[] = [];
    const vaults = await this.getVaults(blockNumber);

    for (const vault of vaults) {
      const makers = await this.filterMakerStrategy(vault, blockNumber);

      for (const strategy of makers) {
        await this.filterInActives(vault, strategy, blockNumber);

        if (this.isActive(vault, strategy)) {
          activeMakers.push(strategy);
        }
      }
    }

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
  ): Promise<string[]> => {
    const strategies = await this.getStrategies(vault, blockNumber);
    const makerStrategies: string[] = [];

    for (const strategy of strategies) {
      const strategyContract = new this.web3.eth.Contract(
        StrategyABI,
        strategy
      );

      const name: string = await strategyContract.methods
        .name()
        .call({}, blockNumber);

      if (name.includes('Maker')) {
        makerStrategies.push(strategy);
      }
    }

    return makerStrategies;
  };

  private getStrategies = async (
    vault: string,
    blockNumber: string | number
  ): Promise<string[]> => {
    const strategies: string[] = [];
    const vaultContract = new this.web3.eth.Contract(VaultABI, vault);

    for (let i = 0; i < 20; i++) {
      const strategy = await vaultContract.methods
        .withdrawalQueue(i)
        .call({}, blockNumber);

      if (strategy && !isZeroAddress(strategy)) {
        strategies.push(strategy);
      } else {
        break;
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

      const isActive: boolean = await strategyContract.methods
        .isActive()
        .call({}, blockNumber);

      if (!isActive) {
        let inActives = this.cache.get(vault);

        if (inActives) {
          inActives.push(strategy);
          this.cache.set(vault, inActives);
        } else {
          this.cache.set(vault, [strategy]);
        }
      }
    }
  };

  private isActive = (vault: string, strategy: string): boolean | undefined => {
    return !this.cache.get(vault)?.includes(strategy);
  };
}
