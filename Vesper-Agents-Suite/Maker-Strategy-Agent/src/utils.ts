import { Finding, FindingSeverity, FindingType } from 'forta-agent';
import { FindingGenerator } from 'forta-agent-tools';
import Web3 from 'web3';
import {
  CONTROLLER_ABI,
  AddressListABI,
  PoolABI,
  Accountant_ABI,
  Strategy_ABI,
  CM_ABI,
} from './abi';

const _web3: Web3 = new Web3();

const CONTROLLER_CONTRACT = '0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217';

export const decodeSingleParam = (ptype: string, encoded: string): any =>
  _web3.eth.abi.decodeParameters([ptype], encoded)[0];

export const createFinding = (_alertId: string): Finding => {
  return Finding.fromObject({
    name: 'Maker ESM Fire Event',
    description: 'Fire event emitted.',
    alertId: _alertId,
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    protocol: 'Vesper',
  });
};

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

export const getAllStrategies = async (
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

  const strategies = await getAllStrategies(web3, blockNumber);

  for (let strategy of strategies) {
    const str = new web3.eth.Contract(Strategy_ABI, strategy);
    const name: string = await str.methods.NAME().call();

    if (name.includes('Maker')) {
      MakerStrategies.push(strategy);
    }
  }

  return MakerStrategies;
};

export const checkIsUnderWaterTrue = async (
  web3: Web3,
  blockNumber: string | number = 'latest',
  address: string
): Promise<boolean> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);

  const isUnderwater = await Strategy.methods.isUnderwater().call();

  return isUnderwater;
};

export const getCollateralRatio = async (
  web3: Web3,
  blockNumber: string | number = 'latest',
  address: string
) => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);
  const CM_ADDRESS = await Strategy.methods.cm().call();

  const CM = new web3.eth.Contract(CM_ABI, CM_ADDRESS);
  const collateralRatio = await CM.methods.getVaultInfo(address).call();

  return collateralRatio;
};

export const getLowWater = async (
  web3: Web3,
  blockNumber: string | number = 'latest',
  address: string
): Promise<number> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);

  const lowWater = await Strategy.methods.lowWater().call();

  return lowWater;
};

export const getHighWater = async (
  web3: Web3,
  blockNumber: string | number = 'latest',
  address: string
): Promise<number> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);

  const lowWater = await Strategy.methods.highWater().call();

  return lowWater;
};
