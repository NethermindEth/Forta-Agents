import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType
} from "forta-agent";
//@ts-ignore
import axios from "axios";

interface Strategy {
  address: string;
  tokens: [];
  info: string;
  weight: number;
}

interface Pools {
  name: string;
  contract: Object;
  strategies: Array<Strategy>;
  strategy: Object;
  poolRewards: Object;
  status: string;
  stage: string;
}

export const provideMakerStrategyHandler = (): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const MakerStrategies: Strategy[] = [];

    const res = await axios("https://api.vesper.finance/dashboard");
    const pools: Pools[] = res.data as Pools[];

    pools.forEach((pool) => {
      pool.strategies.map((strategy) => {
        if (strategy.info.includes("Maker")) {
          MakerStrategies.push(strategy);
        }
      });
    });

    return findings;
  };
};

export default {
  handleBlock: provideMakerStrategyHandler()
};
