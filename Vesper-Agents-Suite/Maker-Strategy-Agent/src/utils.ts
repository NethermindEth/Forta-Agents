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
  const addressListAddress = await controllerContract.methods
    .pools()
    .call({}, blockNumber);

  const addressListContract = new web3.eth.Contract(
    AddressListABI,
    addressListAddress
  );
  const poolsLength: number = Number(
    await addressListContract.methods.length().call({}, blockNumber)
  );

  for (let i = 0; i < poolsLength; i++) {
    const [poolAddress, _] = await addressListContract.methods
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
      const poolAccountant = await poolContract.methods
        .poolAccountant()
        .call({}, blockNumber);
      poolAccountants.add(poolAccountant);
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
    const strategy = await controllerContract.methods
      .strategy(pool)
      .call({}, blockNumber);
    if (!isZeroAddress(strategy)) v2Strategies.add(strategy);
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

    const strategyList: string[] = await acc.methods
      .getStrategies()
      .call({}, blockNumber);
    strategyList.forEach((item) => v3Strategies.add(item));
  }

  return v3Strategies;
};

export const getAllStrategies = async (
  web3: Web3,
  blockNumber: string | number
): Promise<Set<string>> => {
  let strategies: Set<string> = new Set();

  strategies = new Set([
    ...(await getV2Strategies(web3, blockNumber)),
    ...(await getV3Strategies(web3, blockNumber))
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
    const name: string = await str.methods.NAME().call({}, blockNumber);

    if (name.includes("Maker")) MakerStrategies.add(strategy);
  }

  return MakerStrategies;
};

export const checkIsUnderWaterTrue = async (
  web3: Web3,
  address: string,
  blockNumber: string | number = "latest"
): Promise<boolean> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);

  const isUnderwater = await Strategy.methods
    .isUnderwater()
    .call({}, blockNumber);

  return isUnderwater;
};

export const getCollateralRatio = async (
  web3: Web3,
  address: string,
  blockNumber: string | number = "latest"
) => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);
  const CM_ADDRESS = await Strategy.methods.cm().call({}, blockNumber);

  const CM = new web3.eth.Contract(CM_ABI, CM_ADDRESS);
  const collateralRatio = await CM.methods
    .getVaultInfo(address)
    .call({}, blockNumber);

  return collateralRatio;
};

export const getLowWater = async (
  web3: Web3,
  address: string,
  blockNumber: string | number = "latest"
): Promise<number> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);

  const lowWater = await Strategy.methods.lowWater().call({}, blockNumber);

  return lowWater;
};

export const getHighWater = async (
  web3: Web3,
  address: string,
  blockNumber: string | number = "latest"
): Promise<number> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);
  const highWater = await Strategy.methods.highWater().call({}, blockNumber);

  return highWater;
};
