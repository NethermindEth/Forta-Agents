import { Finding, getJsonRpcUrl, BlockEvent, HandleBlock } from "forta-agent";
import BigNumber from "bignumber.js";
import abi from "./pool.abi";
import Web3 from "web3";
import { getTokensHere, getTotalValue, createFinding, getPools } from "./utils";
import TimeTracker from "./time.tracker";

const web3 = new Web3(getJsonRpcUrl());
const tracker: TimeTracker = new TimeTracker();
const ONE_HOUR: number = 3600000; // one hour in miliseconds

function provideHandleFunction(
  web3: Web3,
  cacheTime: number,
  tracker: TimeTracker
  ): HandleBlock {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const blockNumber = blockEvent.blockNumber;

    const pools: any = await getPools();
    const promises: Promise<[any, any, any]>[] = [];
    pools.forEach((value: string) => {
      const contract = new web3.eth.Contract(abi as any, value);
      const totalValue = getTotalValue(contract, blockNumber);
      const tokenHere = getTokensHere(contract, blockNumber);
      promises.push(Promise.all([value, totalValue, tokenHere]));
    });

    const result = await Promise.all(promises as any);

    result.forEach((value: any) => {
      const pool = value[0];
      const totalValue = new BigNumber(value[1]);
      const tokenHere = new BigNumber(value[2]);
      const [success, time] = tracker.tryGetLastTime(pool);
      if (!success) {
        // set this block as the time to start tracking the pool fund
        tracker.update(pool, blockEvent.block.timestamp);
      };
      const elapsed: number = blockEvent.block.timestamp - time;
      if (elapsed >= cacheTime && tokenHere.isGreaterThan(totalValue.multipliedBy(0.35))) {
        findings.push(createFinding(pool, tokenHere.toNumber()));
        tracker.update(pool, blockEvent.block.timestamp);
      }
    });

    return findings;
  };
}

export default {
  handleBlock: provideHandleFunction(web3, ONE_HOUR, tracker),
  provideHandleFunction,
};
