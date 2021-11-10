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
import { FindingGenerator } from "forta-agent-tools";

const CONTROLLER_CONTRACT = "0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217";

export const JUG_DRIP_FUNCTION_SIGNATURE = "drip(bytes32)";
export const JUG_CONTRACT = "0x19c0976f590D67707E62397C87829d896Dc0f1F1";

export const createFindingStabilityFee = (
  _strategy: string
): FindingGenerator => {
  return (metadata): Finding => {
    return Finding.fromObject({
      name: "Stability Fee Update Detection",
      description: "stability Fee is changed for related strategy's collateral",
      severity: FindingSeverity.High,
      type: FindingType.Info,
      alertId: "Vesper-1-2",
      protocol: "Vesper",
      metadata: {
        strategy: _strategy,
        collateralType: metadata?.arguments[0]
      }
    });
  };
};

export const createFindingIsUnderWater = (_strategy: string): Finding => {
  return Finding.fromObject({
    name: "Maker Type Strategy isUnderWater Detection",
    description: "IsUnderWater returned True for a Maker Strategy",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    alertId: "Vesper-1-1",
    protocol: "Vesper",
    metadata: {
      strategy: _strategy
    }
  });
};

export const createFindingLowWater = (
  _strategy: string,
  _collateralRatio: string,
  _lowWater: string
): Finding => {
  return Finding.fromObject({
    name: "Maker Type Strategy Collateral Ratio < lowWater Detection",
    description: "Collateral Ratio is below lowWater",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    alertId: "Vesper-1-1",
    protocol: "Vesper",
    metadata: {
      strategy: _strategy,
      collateralRatio: _collateralRatio,
      lowWater: _lowWater
    }
  });
};

export const createFindingHighWater = (
  _strategy: string,
  _collateralRatio: string,
  _highWater: string
): Finding => {
  return Finding.fromObject({
    name: "Maker Type Strategy Collateral Ratio > highWater Detection",
    description: "Collateral Ratio is above highWater",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "Vesper-1-1",
    protocol: "Vesper",
    metadata: {
      strategy: _strategy,
      collateralRatio: _collateralRatio,
      highWater: _highWater
    }
  });
};

export const getPools = async (
  web3: Web3,
  blockNumber: string | number = "latest"
): Promise<string[]> => {
  const pools: string[] = [];
  const poolCalls = [];

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
    poolCalls.push(addressListContract.methods.at(i).call({}, blockNumber));
  }

  await Promise.all(poolCalls).then((res) => {
    res.forEach(([pool, _]) => {
      if (!isZeroAddress(pool)) {
        pools.push(pool);
      }
    });
  });

  return pools;
};

const getPromise = (web3: Web3, pool: string, blockNumber: string | number) => {
  const contract = new web3.eth.Contract(PoolABI, pool);
  return new Promise((resolve, reject) => {
    resolve(contract.methods.poolAccountant().call({}, blockNumber));
  });
};

export const getPoolAccountants = async (
  web3: Web3,
  blockNumber: string | number
): Promise<string[]> => {
  const poolAccountants: string[] = [];
  const pools: string[] = await getPools(web3, blockNumber);

  const poolAccountantCalls = pools.map((pool) => {
    return getPromise(web3, pool, blockNumber).catch(() => {});
  });

  await Promise.all(poolAccountantCalls).then((res) => {
    res.forEach((poolAccountant: any) => {
      if (poolAccountant && !isZeroAddress(poolAccountant)) {
        poolAccountants.push(poolAccountant);
      }
    });
  });

  return poolAccountants;
};

export const getV2Strategies = async (
  web3: Web3,
  blockNumber: string | number
): Promise<string[]> => {
  let v2Strategies: string[] = [];
  const pools: string[] = await getPools(web3, blockNumber);

  const controllerContract = new web3.eth.Contract(
    CONTROLLER_ABI,
    CONTROLLER_CONTRACT
  );

  const v2StrategyCalls = pools.map((pool) => {
    return controllerContract.methods.strategy(pool).call({}, blockNumber);
  });

  await Promise.all(v2StrategyCalls).then((res) => {
    res.forEach((strategy) => {
      if (!isZeroAddress(strategy)) {
        v2Strategies.push(strategy);
      }
    });
  });

  return v2Strategies;
};

export const getV3Strategies = async (
  web3: Web3,
  blockNumber: string | number
) => {
  let v3Strategies: string[] = [];
  const poolAccountants: string[] = await getPoolAccountants(web3, blockNumber);

  const v3StrategyCalls = poolAccountants.map((accountant) => {
    return new web3.eth.Contract(Accountant_ABI, accountant).methods
      .getStrategies()
      .call({}, blockNumber);
  });

  try {
    await Promise.all(v3StrategyCalls).then((res) => {
      res.forEach((strategy) => {
        if (!isZeroAddress(strategy)) {
          v3Strategies.push(...strategy);
        }
      });
    });
  } catch {}

  return v3Strategies;
};

export const getAllStrategies = async (
  web3: Web3,
  blockNumber: string | number
): Promise<string[]> => {
  let strategies: string[] = [];

  const strategyCalls = [
    getV2Strategies(web3, blockNumber),
    getV3Strategies(web3, blockNumber)
  ];

  await Promise.all(strategyCalls.flat()).then((res) => {
    res.forEach((strategy) => {
      strategies.push(...strategy);
    });
  });

  return strategies;
};

export const getMakerStrategies = async (
  web3: Web3,
  blockNumber: string | number = "latest"
): Promise<string[]> => {
  let MakerStrategies: Set<string> = new Set();

  const strategies = await getAllStrategies(web3, blockNumber);

  for (let strategy of strategies) {
    const str = new web3.eth.Contract(Strategy_ABI, strategy);
    const name: string = await str.methods.NAME().call({}, blockNumber);

    if (name.includes("Maker")) MakerStrategies.add(strategy);
  }

  return Array.from(MakerStrategies);
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

export const getCollateralType = async (
  web3: Web3,
  address: string,
  blockNumber: string | number = "latest"
): Promise<string> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);
  const collateralType = await Strategy.methods
    .collateralType()
    .call({}, blockNumber);

  return collateralType;
};
