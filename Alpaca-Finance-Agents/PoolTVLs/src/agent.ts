import {
  BlockEvent,
  Finding,
  HandleBlock,
  getEthersProvider,
} from "forta-agent";

import {
  getPrice,
  fetchPools,
  getTokenBalance,
  createFinding,
  PoolInfo,
  Fetcher,
} from "./utils";
import { BigNumber, providers, utils } from "ethers";

type Pricer = (
  amount: BigNumber,
  token: string,
  denomination: string,
  blockNumber: number
) => Promise<BigNumber>;

const pricer = async (
  amount: BigNumber,
  token: string,
  denomination: string,
  blockNumber: number
): Promise<BigNumber> => {
  return getPrice(
    amount,
    token,
    denomination,
    blockNumber,
    getEthersProvider()
  );
};

const DATA_URL =
  "https://raw.githubusercontent.com/alpaca-finance/bsc-alpaca-contract/main/.mainnet.json";

const threshold = utils.parseEther("1").mul(2).mul(1e6);

export const USD_PEG = [
  "0x55d398326f99059ff775485246999027b3197955", // BSC-USD
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
  "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
];

const computeTVL = async (
  priceFetcher: Pricer,
  poolInfo: PoolInfo,
  blockNumber: number,
  provider: providers.Provider
): Promise<BigNumber> => {
  const principalInUSD = USD_PEG.includes(poolInfo.principal)
    ? BigNumber.from(1)
    : await priceFetcher(
        utils.parseEther("1"),
        poolInfo.principal,
        USD_PEG[2], // using BUSD because it has pair with almost all the pools
        blockNumber
      );

  const balance = await getTokenBalance(
    poolInfo.principal,
    poolInfo.address,
    blockNumber,
    provider
  );

  return balance.mul(principalInUSD).mul(2);
};

export const provideHandleBlock = (
  poolFetcher: Fetcher,
  pricer: Pricer,
  dataSource: string,
  blockLapse: number,
  threshold: BigNumber,
  provider: providers.Provider,
): HandleBlock => {
  let lastBlock = -blockLapse;

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    if (blockEvent.blockNumber - lastBlock < blockLapse) {
      return [];
    }

    lastBlock = blockEvent.blockNumber;

    const pools = await poolFetcher(dataSource);

    const tvlPromises = pools.map((pool) =>
      computeTVL(pricer, pool, blockEvent.blockNumber, provider)
    );
    const tvls = await Promise.all(tvlPromises);

    for (let i = 0; i < tvls.length; i++) {
      if (tvls[i].lt(threshold)) {
        findings.push(createFinding(pools[i].address, tvls[i].toString()));
      }
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(fetchPools, pricer, DATA_URL, 100, threshold, getEthersProvider()),
};
