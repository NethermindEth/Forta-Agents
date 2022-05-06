import Web3 from "web3";
import LRU from "lru-cache";

import { TimeTracker, VesperFetcher } from 'vesper-forta-module';
import { getJsonRpcUrl } from "forta-agent";
import { BlockEvent, Finding, HandleBlock } from "forta-agent";
import { Strategy_ABI } from "./abi";
import {
  createFinding,
} from "./utils";
const LEVERAGE_STRATEGY_KEY = "_leverageStrategies"
const LEVERAGE_STRATEGY_NAME = "Leverage"
const web3: Web3 = new Web3(getJsonRpcUrl());
const cache: LRU<string, string[]> = new LRU<string, string[]>({ max: 100 });
const tracker: TimeTracker = new TimeTracker();
const vesperFetcher: VesperFetcher = new VesperFetcher(web3);
let cacheTime: number = 3600000; // one hour in milliseconds

export const setCacheTime = (time: number) => {
  cacheTime = time;
}

const fetchLeverageStrategies = async (
  blockNumber: string
): Promise<string[]> => {
  if (blockNumber != "latest" && cache.get(blockNumber) !== undefined)
    return cache.get(blockNumber) as string[];
  let [V3] = await Promise.all([
    vesperFetcher.getStrategiesV3(blockNumber)
  ]);
  V3 = Array.from(new Set<string>(V3));
  const valueV3promise = V3.map(async (strat: string) => {
    const sContract = new web3.eth.Contract(
      Strategy_ABI,
      strat,
    );
    const name: string = await sContract.methods.NAME().call({}, blockNumber);
    if (!name.includes(LEVERAGE_STRATEGY_NAME)) return BigInt(0);
    return Boolean(await sContract.methods.isLossMaking().call({}, blockNumber));
  });

  const allValue = (await Promise.all([
    valueV3promise,
  ].flat()));

  const allStrat: string[] = V3;

  const leverageValidStrat: string[] = allStrat.filter(
    (_: string, idx: number) => allValue[idx] > BigInt(0),
  );

  cache.set(blockNumber, leverageValidStrat);
  return leverageValidStrat;
};

const getLeverageStrategies = async (blockNumber: string) => {
  const currentTime = Date.now()
  const [success, time] = tracker.tryGetLastTime(LEVERAGE_STRATEGY_KEY);
  if (!success || (currentTime - time >= cacheTime)) {
    const leverageStrategies = await fetchLeverageStrategies(blockNumber);
    tracker.update(LEVERAGE_STRATEGY_KEY, currentTime);
    cache.set(LEVERAGE_STRATEGY_KEY, leverageStrategies)
    return leverageStrategies;
  }
  return cache.get(LEVERAGE_STRATEGY_KEY)
}

export const provideLeverageStrategyHandler = (
  web3: Web3,
  timeThreshold: number,
  tracker: TimeTracker
): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const promises: any = [];
    const leverageStrategies = await getLeverageStrategies(blockEvent.blockNumber + '');
    if (leverageStrategies) {
      leverageStrategies.forEach((strategy: string) => {
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
  handleBlock: provideLeverageStrategyHandler(web3, cacheTime, tracker),
  provideLeverageStrategyHandler,
};
