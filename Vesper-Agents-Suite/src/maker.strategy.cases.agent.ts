import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType
} from "forta-agent";
import {
  IsUnderWaterCall,
  Pools,
  propertyFetcher,
  PropertyFetcher,
  Strategy
} from "./utils";
//@ts-ignore
import axios from "axios";

export const provideMakerStrategyHandler = (
  web3Call: any,
  address: string = "0x235A6DCe7D40fa5b0157F55Dda0693dcAc4Ea932"
): HandleBlock => {
  const isUnderWater: PropertyFetcher = propertyFetcher(
    web3Call,
    address,
    IsUnderWaterCall(address),
    "bool"
  );

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

export default provideMakerStrategyHandler;
