import Web3 from 'web3';
import LRU from 'lru-cache';
import { isZeroAddress } from 'ethereumjs-util';
import { HelperABI, StrategyABI, VaultABI } from './abi';

type blockNumber = string | number;
type strategies = string[];

const HELPER = '0x437758D475F70249e03EDa6bE23684aD1FC375F0';

export default class MakerFetcher {
  private cache: LRU<blockNumber, strategies>;
  private web3: Web3;

  constructor(web3: Web3) {
    this.cache = new LRU<blockNumber, strategies>({ max: 10_000 });
    this.web3 = web3;
  }

  public getActiveMakers = async (
    blockNumber: string | number = 'latest'
  ): Promise<string[] | undefined> => {
    if (blockNumber != 'latest' && this.cache.get(blockNumber) !== undefined)
      return this.cache.get(blockNumber);
    const allMakers: string[] = [];
    const activeMakers: string[] = [];
    const isActiveCalls: any = [];
    const vaults = await this.getVaults(blockNumber);

    const makerCalls = vaults.map((vault) => {
      return this.filterMakerStrategy(vault, blockNumber);
    });

    await Promise.all(makerCalls).then((res) => {
      res.forEach((maker) => {
        if (maker.length !== 0) {
          allMakers.push(...maker);
        }
      });
    });

    allMakers.forEach((maker) => {
      isActiveCalls.push(
        this.isActive(maker, blockNumber).then((res) => {
          return {
            strategy: maker,
            isActive: res,
          };
        })
      );
    });

    await Promise.all(isActiveCalls).then((res) => {
      res.forEach((result: any) => {
        if (result.isActive) {
          activeMakers.push(result.strategy);
        }
      });
    });

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
    const nameCalls: any = [];

    strategies.forEach((strategy) => {
      nameCalls.push(
        this.getName(strategy, blockNumber).then((res: string) => {
          return {
            strategy: strategy,
            name: res,
          };
        })
      );
    });

    await Promise.all(nameCalls).then((res) => {
      res.forEach((result: any) => {
        if (result.name.includes('Maker')) {
          makerStrategies.push(result.strategy);
        }
      });
    });

    return makerStrategies;
  };

  private getName = async (strategy: string, blockNumber: string | number) => {
    const contract = new this.web3.eth.Contract(StrategyABI, strategy);
    const name = await contract.methods.name().call({}, blockNumber);
    return name;
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
