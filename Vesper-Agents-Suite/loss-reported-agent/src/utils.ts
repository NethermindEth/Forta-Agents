import { Finding, FindingType, FindingSeverity, Log } from "forta-agent";
import {
  FindingGenerator,
  decodeParameters,
  decodeParameter,
} from "forta-agent-tools";
import Web3 from "web3";
import { PoolABI } from "./abi";
import LRU from "lru-cache";
const axios = require("axios");
export const API_URL = "https://api.vesper.finance/dashboard?version=2";
const STATUS = "operative";
const ALLOWED_STAGES = ["prod", "beta", "orbit"];
const IGNORE_ADDRESS = ["0xbA4cFE5741b357FA371b506e5db0774aBFeCf8Fc"];
const poolAccountantsCache = new LRU({ max: 10_000 });

export const createFindingCallDetector: FindingGenerator = (callInfo) => {
  return Finding.fromObject({
    name: "Loss Reported",
    description:
      "A loss was reported by a V3 strategy",
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

const getPools = async () => {
  return axios.get(API_URL).then((response: { data: { pools: any[] } }) => {
    return response.data.pools
      .filter(
        (pool: {
          status: string;
          stage: string;
          contract: { version: string; address: string };
        }) =>
          pool.status === STATUS &&
          ALLOWED_STAGES.includes(pool.stage) &&
          !IGNORE_ADDRESS.includes(pool.contract.address)
      )
      .map((pool) => pool.contract.address);
  });
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
  const pools: string[] = await getPools();
  for (let pool of pools) {
    try {
      const poolContract = new web3.eth.Contract(PoolABI, pool);
      const poolAccountant = await poolContract.methods
        .poolAccountant()
        .call({}, blockNumber);
      poolAccountants.push(poolAccountant);
    } catch { 
      
    }
  }
  poolAccountantsCache.set(blockNumber, poolAccountants);
  return poolAccountants;
};
