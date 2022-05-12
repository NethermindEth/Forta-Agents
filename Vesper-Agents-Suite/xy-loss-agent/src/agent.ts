import Web3 from "web3";
import LRU from "lru-cache";

import { TimeTracker, VesperFetcher } from 'vesper-forta-module';
import { getJsonRpcUrl } from "forta-agent";
import { BlockEvent, Finding, HandleBlock } from "forta-agent";
import { Strategy_ABI, Borrow_Token_ABI } from "./abi";
import poolAbi from "./pool.abi";
import { createFinding } from "./utils";
import BigNumber from "bignumber.js";
const XY_STRATEGY_KEY = "_xyStrategies"
const XY_STRATEGY_NAME = "XYStrategy"
const web3: Web3 = new Web3(getJsonRpcUrl());
const cache: LRU<string, string[]> = new LRU<string, string[]>({ max: 100 });
const tracker: TimeTracker = new TimeTracker();
const vesperFetcher: VesperFetcher = new VesperFetcher(web3);
let cacheTime: number = 3600000; // one hour in milliseconds

export const setCacheTime = (time: number) => {
  cacheTime = time;
}

const fetchXYStrategies = async (
  blockNumber: string
): Promise<string[]> => {
  if (blockNumber != "latest" && cache.get(blockNumber) !== undefined)
    return cache.get(blockNumber) as string[];
  let [V3] = await Promise.all([
    vesperFetcher.getStrategiesV3(blockNumber)
  ]);
  V3 = Array.from(new Set<string>(V3));
  const valueV3promise = V3.map(async (strategy: string) => {
    const sContract = new web3.eth.Contract(
      Strategy_ABI,
      strategy,
    );

    const name: string = await sContract.methods.NAME().call({}, blockNumber);
    if (!name.includes(XY_STRATEGY_NAME)) return BigInt(0);

    // get borrow token APY
    const borrowCTokenAddress: string = await sContract.methods.borrowCToken().call({}, blockNumber);
    const borrowCToken = new web3.eth.Contract(
      Borrow_Token_ABI,
      borrowCTokenAddress,
    );
    const debtOfBorrowedToken = new BigNumber(await borrowCToken.methods.borrowBalanceStored(strategy).call({}, blockNumber));

    // get Vesper pool APY
    const yPoolAddress: string = await sContract.methods.vPool().call({}, blockNumber);
    const yPoolContract = new web3.eth.Contract(poolAbi as any, yPoolAddress);
    const yPoolPricePerShare = new BigNumber(await yPoolContract.methods.pricePerShare().call({}, blockNumber));

    const strategyBalance = new BigNumber(await yPoolContract.methods.balanceOf(strategy).call({}, blockNumber));
    const yPoolEarning = new BigNumber(yPoolPricePerShare.multipliedBy(strategyBalance).dividedBy(new BigNumber('1e18')))
    return Boolean(yPoolEarning.isLessThan(debtOfBorrowedToken));
  });

  const allValue = (await Promise.all([
    valueV3promise,
  ].flat()));

  const allStrategies: string[] = V3;

  const xyValidStrategy: string[] = allStrategies.filter(
    (_: string, idx: number) => allValue[idx] > BigInt(0),
  );

  cache.set(blockNumber, xyValidStrategy);
  return xyValidStrategy;
};

const getXYStrategies = async (blockNumber: string) => {
  const currentTime = Date.now()
  const [success, time] = tracker.tryGetLastTime(XY_STRATEGY_KEY);
  if (!success || (currentTime - time >= cacheTime)) {
    const xyStrategies = await fetchXYStrategies(blockNumber);
    tracker.update(XY_STRATEGY_KEY, currentTime);
    cache.set(XY_STRATEGY_KEY, xyStrategies)
    return xyStrategies;
  }
  return cache.get(XY_STRATEGY_KEY)
}

export const provideXYStrategyHandler = (
  web3: Web3,
  timeThreshold: number,
  tracker: TimeTracker
): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const promises: any = [];
    const xyStrategies = await getXYStrategies(blockEvent.blockNumber + '');
    if (xyStrategies) {
      xyStrategies.forEach((strategy: string) => {
        promises.push(
          vesperFetcher.isLossMaking(web3, strategy, blockEvent.blockNumber).then(
            (_isLossMaking: any) => {
              return {
                strategy,
                isLossMaking: _isLossMaking
              };
            }
          )
        );
      });

      const results: any = (await Promise.all(promises)).flat();
      for (let res of results) {
        const [success, time] = tracker.tryGetLastTime(res.strategy);
        if (!success) {
          // set this block as the time to start tracking the strategy
          tracker.update(res.strategy, blockEvent.block.timestamp);
        };
        const elapsed: number = blockEvent.block.timestamp - time;
        if (elapsed >= timeThreshold && res.isLossMaking) {
          tracker.update(res.strategy, blockEvent.block.timestamp);
          findings.push(
            createFinding(
              res.strategy.toString(),
              res.isLossMaking
            )
          );
        }
      }
    }

    return findings;
  };
};

export default {
  handleBlock: provideXYStrategyHandler(web3, cacheTime, tracker)
};
