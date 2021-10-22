import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { isZeroAddress } from "ethereumjs-util";
import Web3 from "web3";
import {
  CONTROLLER_ABI,
  AddressListABI,
  PoolABI,
  Accountant_ABI,
  Strategy_ABI,
  CM_ABI
} from "./abi";

const CONTROLLER_CONTRACT = "0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217";

export const enum TYPE {
  isUnderWater,
  lowWater,
  highWater
}

export const createFinding = (
  _alertId: string,
  _type: TYPE,
  _strategy: string,
  _collateralRatio: string = "",
  _comparedValue: string = ""
): Finding => {
  if (_type == TYPE.isUnderWater) {
    return Finding.fromObject({
      name: "Maker Type Strategy isUnderWater Detection",
      description: "IsUnderWater returned True for a Maker Strategy",
      severity: FindingSeverity.High,
      type: FindingType.Suspicious,
      alertId: _alertId,
      protocol: "Vesper",
      metadata: {
        strategy: _strategy
      }
    });
  } else if (_type == TYPE.lowWater) {
    return Finding.fromObject({
      name: "Maker Type Strategy Collateral Ratio < lowWater Detection",
      description: "Collateral Ratio is below lowWater",
      severity: FindingSeverity.Critical,
      type: FindingType.Suspicious,
      alertId: _alertId,
      protocol: "Vesper",
      metadata: {
        strategy: _strategy,
        collateralRatio: _collateralRatio,
        lowWater: _comparedValue
      }
    });
  } else {
    return Finding.fromObject({
      name: "Maker Type Strategy Collateral Ratio > highWater Detection",
      description: "Collateral Ratio is above highWater",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      alertId: _alertId,
      protocol: "Vesper",
      metadata: {
        strategy: _strategy,
        collateralRatio: _collateralRatio,
        highWater: _comparedValue
      }
    });
  }
};

export const getPools = async (
  web3: Web3,
  blockNumber: string | number = "latest"
): Promise<Set<string>> => {
  const pools: Set<string> = new Set();

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
    pools.add(poolAddress);
  }

  return pools;
};

export const getPoolAccountants = async (
  web3: Web3,
  blockNumber: string | number
): Promise<Set<string>> => {
  const poolAccountants: Set<string> = new Set();

  const pools: Set<string> = await getPools(web3, blockNumber);

  for (let pool of Array.from(pools)) {
    try {
      const poolContract = new web3.eth.Contract(PoolABI, pool);
      poolAccountants.add(await poolContract.methods.poolAccountant().call());
    } catch {}
  }

  return poolAccountants;
};

export const getV2Strategies = async (
  web3: Web3,
  blockNumber: string | number
) => {
  let v2Strategies: Set<string> = new Set();
  const pools: Set<string> = await getPools(web3, blockNumber);

  const controllerContract = new web3.eth.Contract(
    CONTROLLER_ABI,
    CONTROLLER_CONTRACT
  );

  for (let pool of Array.from(pools)) {
    try {
      const strategy = await controllerContract.methods.strategy(pool).call();
      if (!isZeroAddress(strategy)) {
        v2Strategies = new Set([...Array.from(v2Strategies), ...strategy]);
      }
    } catch {}
  }

  return v2Strategies;
};

export const getV3Strategies = async (
  web3: Web3,
  blockNumber: string | number
) => {
  let v3Strategies: Set<string> = new Set();
  const poolAccountants: Set<string> = await getPoolAccountants(
    web3,
    blockNumber
  );

  for (let accountant of Array.from(poolAccountants)) {
    const acc = new web3.eth.Contract(Accountant_ABI, accountant);

    const strategyList: string[] = await acc.methods.getStrategies().call();
    v3Strategies = new Set([...Array.from(v3Strategies), ...strategyList]);
  }

  return v3Strategies;
};

export const getAllStrategies = async (
  web3: Web3,
  blockNumber: string | number
): Promise<Set<string>> => {
  let strategies: Set<string> = new Set();

  strategies = new Set([
    ...Array.from(await getV2Strategies(web3, blockNumber)),
    ...Array.from(await getV3Strategies(web3, blockNumber))
  ]);

  return strategies;
};

export const getMakerStrategies = async (
  web3: Web3,
  blockNumber: string | number = "latest"
): Promise<Set<string>> => {
  let MakerStrategies: Set<string> = new Set();

  const strategies = await getAllStrategies(web3, blockNumber);

  for (let strategy of Array.from(strategies)) {
    const str = new web3.eth.Contract(Strategy_ABI, strategy);
    const name: string = await str.methods.NAME().call();

    if (name.includes("Maker")) MakerStrategies.add(strategy);
  }

  return MakerStrategies;
};

export const checkIsUnderWaterTrue = async (
  web3: Web3,
  address: string
): Promise<boolean> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);

  const isUnderwater = await Strategy.methods.isUnderwater().call();

  return isUnderwater;
};

export const getCollateralRatio = async (web3: Web3, address: string) => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);
  const CM_ADDRESS = await Strategy.methods.cm().call();

  const CM = new web3.eth.Contract(CM_ABI, CM_ADDRESS);
  const collateralRatio = await CM.methods.getVaultInfo(address).call();

  return collateralRatio;
};

export const getLowWater = async (
  web3: Web3,
  address: string
): Promise<number> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);

  const lowWater = await Strategy.methods.lowWater().call();

  return lowWater;
};

export const getHighWater = async (
  web3: Web3,
  address: string
): Promise<number> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);

  const lowWater = await Strategy.methods.highWater().call();

  return lowWater;
};
