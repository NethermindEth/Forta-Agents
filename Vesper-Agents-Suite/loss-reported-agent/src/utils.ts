import { Finding, FindingType, FindingSeverity, Log } from "forta-agent";
import {
  FindingGenerator,
  decodeFunctionCallParameters,
  decodeParameters,
  decodeParameter,
} from "forta-agent-tools";
import Web3 from "web3";
import { ControllerABI, AddressListABI, PoolABI } from "./abi";
import LRU from "lru-cache";

const poolAccountantsCache = new LRU({ max: 10_000 });

const controllerAddresss = "0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217";

export const createFindingCallDetector: FindingGenerator = (callInfo) => {
  return Finding.fromObject({
    name: "Loss Reported",
    description: "A loss was reported by a V3 strategy",
    alertId: "Vesper-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Vesper",
    metadata: {
      strategyAddress: callInfo?.arguments[0],
      lossValue: callInfo?.arguments[1],
    },
  });
};

export const createFindingEventDetector: FindingGenerator = (eventInfo) => {
  const { 1: lossValue } = decodeParameters(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
    eventInfo?.data
  );
  const address: string = decodeParameter("address", eventInfo?.topics[1]);

  return Finding.fromObject({
    name: "Loss Reported",
    description: "A loss was reported by a V3 strategy",
    alertId: "Vesper-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Vesper",
    metadata: {
      strategyAddress: address,
      lossValue: lossValue,
    },
  });
};

export const hasLosses = (log: Log) => {
  const data = log.data;
  const { 1: loss } = decodeParameters(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
    data
  );
  return BigInt(loss) > BigInt(0);
};

const getPools = async (
  web3: Web3,
  blockNumber: string | number
): Promise<string[]> => {
  const pools: string[] = [];

  const controllerContract = new web3.eth.Contract(
    ControllerABI,
    controllerAddresss
  );
  const addressListAddress: string = await controllerContract.methods
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
    const poolAddress = await addressListContract.methods
      .at(i)
      .call({}, blockNumber);
    pools.push(poolAddress);
  }
  return pools;
};

export const getPoolAccountants = async (
  web3: Web3,
  blockNumber: number | string = "latest"
): Promise<string[]> => {
  if (
    blockNumber !== "latest" &&
    poolAccountantsCache.get(blockNumber) !== undefined
  ) {
    return poolAccountantsCache.get(blockNumber) as any;
  }

  const poolAccountants: string[] = [];
  const pools: string[] = await getPools(web3, blockNumber);

  for (let pool of pools) {
    try {
      const poolContract = new web3.eth.Contract(PoolABI, pool);
      poolAccountants.push(
        await poolContract.methods.poolAccountant().call({}, blockNumber)
      );
    } catch {}
  }

  poolAccountantsCache.set(blockNumber, poolAccountants);
  return poolAccountants;
};
