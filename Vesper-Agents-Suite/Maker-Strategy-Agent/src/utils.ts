import { Finding, FindingSeverity, FindingType } from 'forta-agent';
import { decodeParameter, FindingGenerator } from 'forta-agent-tools';
import Web3 from 'web3';
import {
  IsUnderWater_Json_Interface,
  CONTROLLER_ABI,
  AddressListABI,
  PoolABI,
  Accountant_ABI,
  Strategy_ABI,
} from './abi';

const _web3: Web3 = new Web3();

const CONTROLLER_CONTRACT = '0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217';

export interface Strategy {
  address: string;
  tokens: [];
  info: string;
  weight: number;
}

export interface Pools {
  name: string;
  contract: Object;
  strategies: Array<Strategy>;
  strategy: Object;
  poolRewards: Object;
  status: string;
  stage: string;
}

export const decodeSingleParam = (ptype: string, encoded: string): any =>
  _web3.eth.abi.decodeParameters([ptype], encoded)[0];

export const IsUnderWaterCall = (addr: string): string =>
  _web3.eth.abi.encodeFunctionCall(IsUnderWater_Json_Interface, [addr]);

export const getPools = async (
  web3: Web3,
  blockNumber: string | number = 'latest'
): Promise<string[]> => {
  const pools: string[] = [];

  const controllerContract = new web3.eth.Contract(
    CONTROLLER_ABI,
    CONTROLLER_CONTRACT
  );
  const addressListAddress = await controllerContract.methods.pools().call();

  const addressListContract = new web3.eth.Contract(
    AddressListABI,
    addressListAddress
  );
  const poolsLength: number = Number(
    await addressListContract.methods.length().call()
  );

  for (let i = 0; i < poolsLength; i++) {
    const poolAddress = await addressListContract.methods
      .at(i)
      .call({}, blockNumber);
    pools.push(poolAddress);
  }

  return pools;
};

export const getPoolAccountants = async (
  web3: Web3,
  blockNumber: string | number
): Promise<string[]> => {
  const poolAccountants: string[] = [];

  const pools: string[] = await getPools(web3, blockNumber);

  for (let pool of pools) {
    try {
      const poolContract = new web3.eth.Contract(PoolABI, pool);
      poolAccountants.push(await poolContract.methods.poolAccountant().call());
    } catch {}
  }

  return poolAccountants;
};

export const getStrategies = async (
  web3: Web3,
  blockNumber: string | number
): Promise<string[]> => {
  let strategies: string[] = [];
  const poolAccountants: string[] = await getPoolAccountants(web3, blockNumber);

  for (let accountant of poolAccountants) {
    const acc = new web3.eth.Contract(Accountant_ABI, accountant);

    const strategyList: string[] = await acc.methods.getStrategies().call();
    strategies.push(...strategyList);
  }
  return strategies;
};

export const getMakerStrategies = async (
  web3: Web3,
  blockNumber: string | number = 'latest'
): Promise<string[]> => {
  let MakerStrategies: string[] = [];

  const strategies = await getStrategies(web3, blockNumber);

  for (let strategy of strategies) {
    const str = new web3.eth.Contract(Strategy_ABI, strategy);
    const name: string = await str.methods.NAME().call();

    if (name.includes('Maker')) {
      MakerStrategies.push(strategy);
    }
  }

  return MakerStrategies;
};

export const checkIsUnderWater = async (
  web3: Web3,
  blockNumber: string | number = 'latest',
  address: string
): Promise<boolean> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);

  const isUnderwater: boolean = await Strategy.methods.isUnderwater().call();

  return isUnderwater;
};

export const createFinding: FindingGenerator = () => {
  return Finding.fromObject({
    name: 'Is Under Water Detection',
    description: 'Is under water is True',
    alertId: 'Vesper-1',
    type: FindingType.Info,
    severity: FindingSeverity.Info,
  });
};
