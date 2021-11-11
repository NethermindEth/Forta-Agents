import Web3 from 'web3';
import LRU from 'lru-cache';
import { isZeroAddress } from 'ethereumjs-util';
import { HelperABI, StrategyABI, VaultABI } from './abi';
import BigNumber from 'bignumber.js'

type MakerInfo = {
  address: string,
  keeper: string,
  currentMakerVaultRatio: BigNumber,
  collateralizationRatio: BigNumber,
  rebalanceTolerance: BigNumber,
  checkedRatio: boolean, // to denote whether we have checked "makervaultratio < threshold" for the strategy at a specific block
}

const HELPER = '0x437758D475F70249e03EDa6bE23684aD1FC375F0';
export default class MakerFetcher {
  private cache: LRU<string | number, MakerInfo[]>;
  private web3: Web3;

  constructor(web3: Web3) {
    this.cache = new LRU<string | number, MakerInfo[]>({ max: 10_000 });
    this.web3 = web3;
  }

  public getActiveMakersInfo = async (blockNumber: string | number = 'latest'): Promise<MakerInfo[] | undefined> => {
    if (blockNumber !== 'latest' && this.cache.get(blockNumber) !== undefined) 
      return this.cache.get(blockNumber);

    const activeMakersInfo: MakerInfo[] = [];
    const vaults = await this.getVaults(blockNumber);
    let makers: string[] = [];
    const makerCalls = vaults.map((vault) => {
      return this.filterMakerStrategy(vault, blockNumber);
    });

    await Promise.all(makerCalls).then((res) => {
      res.forEach((maker) => {
        if (maker.length !== 0) {
          makers = makers.concat(maker)
        }
      });
    });

    for (const strategy of makers) {
      const strategyContract = new this.web3.eth.Contract(
          StrategyABI,
          strategy
      );

      const isActive: boolean = await strategyContract.methods
        .isActive()
        .call({}, blockNumber);

      if (isActive)
      { 
        const keeper: string = await strategyContract.methods
            .keeper()
            .call({},blockNumber);
        const currentMakerVaultRatio: BigNumber = new BigNumber(await strategyContract.methods
          .getCurrentMakerVaultRatio()
          .call({}, blockNumber));
        const collateralizationRatio: BigNumber = new BigNumber(await strategyContract.methods
            .collateralizationRatio()
            .call({}, blockNumber));
        const rebalanceTolerance: BigNumber = new BigNumber(await strategyContract.methods
            .rebalanceTolerance()
            .call({}, blockNumber));
        const info: MakerInfo = { address: strategy, keeper, currentMakerVaultRatio,
                                collateralizationRatio, rebalanceTolerance, checkedRatio: false }
        activeMakersInfo.push(info);
      }
    }

    this.cache.set(blockNumber,activeMakersInfo);
    return activeMakersInfo;
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
}

