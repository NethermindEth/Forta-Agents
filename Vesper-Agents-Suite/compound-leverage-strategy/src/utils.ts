import {
  strategyABI,
  comptrollerABI,
  vesperControllerABI,
  poolABI,
  addressListABI,
} from "./abi";
import Web3 from "web3";
import { createAddress, decodeParameter } from "forta-agent-tools";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

const zeroAddress = createAddress("0x0");
export const comptrollerAddress = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";
export const vesperControllerAddress = "0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217";

export const createFindingForHighCurrentBorrowRatio = (
  strategyAddress: string
) => {
  return Finding.fromObject({
    name: "High Borrow Ratio",
    description: "The current borrow ratio is above the max borrow ratio",
    alertId: "Vesper-5-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Vesper",
    metadata: {
      strategyAddress: strategyAddress,
    },
  });
};

export const createFindingForLiquidationWarning = (strategyAddress: string) => {
  return Finding.fromObject({
    name: "Liquidation Warning",
    description:
      "The current borrow ratio is close to compound collateral factor",
    alertId: "Vesper-5-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Vesper",
    metadata: {
      strategyAddress: strategyAddress,
    },
  });
};

export const getCurrentBorrowRatio = async (
  web3: Web3,
  contractAddress: string,
  blockNumber: string | number
): Promise<bigint> => {
  const strategyContract = new web3.eth.Contract(strategyABI, contractAddress);
  const currentBorrowRatio = await strategyContract.methods
    .currentBorrowRatio()
    .call(blockNumber);
  return BigInt(currentBorrowRatio);
};

export const getScaledCurrentBorrowRatio = async (
  web3: Web3,
  contractAddress: string,
  blockNumber: string | number
): Promise<bigint> => {
  const currentBorrowRatio = await getCurrentBorrowRatio(
    web3,
    contractAddress,
    blockNumber
  );
  return currentBorrowRatio * BigInt(1e14);
};

export const getMaxBorrowRatio = async (
  web3: Web3,
  contractAddress: string,
  blockNumber: string | number
): Promise<BigInt> => {
  const strategyContract = new web3.eth.Contract(strategyABI, contractAddress);
  const { maxBorrowRatio } = await strategyContract.methods
    .borrowRatioRange()
    .call(blockNumber);
  return BigInt(maxBorrowRatio);
};

export const getRelatedCToken = async (
  web3: Web3,
  contractAddress: string,
  blockNumber: string | number
): Promise<string> => {
  return decodeParameter(
    "address",
    await web3.eth.getStorageAt(contractAddress, 11, blockNumber)
  );
};

export const getCollateralFactorMantissa = async (
  web3: Web3,
  cToken: string,
  blockNumber: string | number
): Promise<bigint> => {
  const comptrollerContract = new web3.eth.Contract(
    comptrollerABI,
    comptrollerAddress
  );
  const { collateralFactorMantissa } = await comptrollerContract.methods
    .markets(cToken)
    .call(blockNumber);
  return BigInt(collateralFactorMantissa);
};

const getVesperPools = async (
  web3: Web3,
  blockNumber: string | number
): Promise<string[]> => {
  const pools: string[] = [];

  const controllerContract = new web3.eth.Contract(
    vesperControllerABI,
    vesperControllerAddress
  );
  const addressListAddress: string = await controllerContract.methods
    .pools()
    .call({}, blockNumber);

  const addressListContract = new web3.eth.Contract(
    addressListABI,
    addressListAddress
  );
  const poolsLength: number = Number(
    await addressListContract.methods.length().call({}, blockNumber)
  );

  for (let i = 0; i < poolsLength; i++) {
    const poolAddress = await addressListContract.methods
      .at(i)
      .call({}, blockNumber);
    pools.push(poolAddress);
  }
  return pools;
};

const getStrategiesAsV2 = async (
  web3: Web3,
  blockNumber: string | number,
  pool: string
): Promise<string[]> => {
  const vesperControllerContract = new web3.eth.Contract(
    vesperControllerABI,
    vesperControllerAddress
  );
  const strategy = await vesperControllerContract.methods
    .strategy(pool)
    .call(blockNumber);
  return strategy === zeroAddress ? [] : [strategy];
};

const getStrategiesAsV3 = async (
  web3: Web3,
  blockNumber: string | number,
  pool: string
): Promise<string[]> => {
  const vesperPoolContract = new web3.eth.Contract(poolABI, pool);
  try {
    const strategies = await vesperPoolContract.methods
      .getStrategies()
      .call(blockNumber);
    return strategies;
  } catch {
    return [];
  }
};

const getStrategies = async (
  web3: Web3,
  blockNumber: string | number
): Promise<string[]> => {
  let strategies: string[] = [];
  const pools = await getVesperPools(web3, blockNumber);
  for (let pool of pools) {
    strategies = strategies.concat(
      await getStrategiesAsV2(web3, blockNumber, pool)
    );
    strategies = strategies.concat(
      await getStrategiesAsV3(web3, blockNumber, pool)
    );
  }
  return strategies;
};

export const getCompoundLeverageStrategies = async (
  web3: Web3,
  blockNumber: string | number
): Promise<string[]> => {
  const compoundLeverageStrategies: string[] = [];
  const strategies = await getStrategies(web3, blockNumber);

  for (let strategy of strategies) {
    const strategyContract = new web3.eth.Contract(strategyABI, strategy);
    const strategyName: string = await strategyContract.methods
      .NAME()
      .call(blockNumber);
    if (strategyName.includes("Compound-Leverage")) {
      compoundLeverageStrategies.push(strategy);
    }
  }
  return compoundLeverageStrategies;
};
