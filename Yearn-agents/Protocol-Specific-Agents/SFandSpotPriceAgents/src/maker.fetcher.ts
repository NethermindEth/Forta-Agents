import Web3 from 'web3';
import LRU from 'lru-cache';
import { isZeroAddress } from 'ethereumjs-util';
import { HelperABI, StrategyABI, VaultABI } from './abi';

type blockNumber = string | number;
type data = string[];

const HELPER = '0x437758D475F70249e03EDa6bE23684aD1FC375F0';

export default class MakerFetcher {
  private cache: LRU<blockNumber, data>;
  private web3: Web3;

  constructor(web3: Web3) {
    this.cache = new LRU<blockNumber, data>({ max: 10_000 });
    this.web3 = web3;
  }

  public getActiveMakers = async (
    blockNumber: string | number = 'latest'
  ): Promise<string[] | undefined> => {
    if (blockNumber != 'latest' || this.cache.get(blockNumber) !== undefined)
      return this.cache.get(blockNumber);

    const activeMakers: string[] = [];
    const vaults = await this.getVaults(blockNumber);

    for (const vault of vaults) {
      const makers = await this.filterMakerStrategy(vault, blockNumber);

      for (const strategy of makers) {
        if (await this.isActive(vault, strategy, blockNumber)) {
          activeMakers.push(strategy);
        }
      }
    }
    this.cache.set(blockNumber, activeMakers);
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

  private isActive = async (
    vault: string,
    strategy: string,
    blockNumber: string | number
  ): Promise<boolean> => {
    const strategyContract = new this.web3.eth.Contract(StrategyABI, strategy);

    const isActive: boolean = await strategyContract.methods
      .isActive()
      .call({}, blockNumber);

    return isActive;
  };
}
