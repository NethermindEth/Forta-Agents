import MockProvider from "./mock.provider"
import StrategyFetcher, { TickInfo } from "./strategy.fetcher";
import { createAddress } from "forta-agent-tools";
import { Interface } from "@ethersproject/abi";
import { utils, BigNumber } from "ethers";
import abi from "./abi";

const KEEPER_IFACE: Interface = new Interface(abi.KEEPER);
const STRAT_IFACE: Interface = new Interface(abi.STRATEGY);
const POOL_IFACE: Interface = new Interface(abi.POOL);

const STRATEGIES: string[] = [
  createAddress("0xE0A1"),
  createAddress("0xE0A2"),
  createAddress("0xE0A3"),
  createAddress("0xE0A4"),
]

describe("StrategyFetcher tests suite", () => {
  const keeper: string = createAddress("0x101");
  const mockProvider: MockProvider = new MockProvider();
  const fetcher: StrategyFetcher = new StrategyFetcher(keeper, mockProvider as any);

  const addStrategies = (length: number, block: number) => {
    mockProvider.addStorage(
      keeper, 0, block, 
      utils.defaultAbiCoder.encode(['uint256'], [length])
    );
    for(let i = 0; i < length; ++i){
      mockProvider.addCallTo(
        keeper, block, KEEPER_IFACE, 'strategyArray',
        { inputs:[i], outputs:[STRATEGIES[i]]},
      )
    }
  };

  beforeEach(() => mockProvider.clear());

  it("should store the correct keeper", () => {
    for(let i = 0; i < 10; ++i){
      const addr: string = createAddress(`0xDA0${i}`);
      const fetcher: StrategyFetcher = new StrategyFetcher(addr, mockProvider as any);

      expect(fetcher.keeper).toStrictEqual(addr);
    }
  });

  it("should return the addresses", async () => {
    addStrategies(3, 20);
    let addresses: string[] = await fetcher.getStrategies(20);
    expect(addresses).toStrictEqual(STRATEGIES.slice(0, 3).map(s => s.toLowerCase()));

    addStrategies(4, 1001);
    addresses = await fetcher.getStrategies(1001);
    expect(addresses).toStrictEqual(STRATEGIES.slice(0, 4).map(s => s.toLowerCase()));
  });

  it("should return the ticks", async () => {
    const block: number = 500;
    addStrategies(4, block);
    
    const addresses: string[] = await fetcher.getStrategies(block);
    for(let i = 0; i < 4; ++i){
      const strat: string = addresses[i];
      const pool: string = createAddress(`0x${i}`);
      mockProvider
        .addCallTo(
          strat, block, STRAT_IFACE, "tick_lower",
          { inputs:[], outputs:[i]},
        )
        .addCallTo(
          strat, block, STRAT_IFACE, "tick_upper",
          { inputs:[], outputs:[i + 1]},
        )
        .addCallTo(
          strat, block, STRAT_IFACE, "pool",
          { inputs:[], outputs:[pool]},
        )
        .addCallTo(
          pool, block, POOL_IFACE, "slot0",
          { inputs:[], outputs:[0, i + 2, 0, 0, 0, false]},
        );

      const ticks: TickInfo = await fetcher.getTicks(block, strat);
      expect(ticks).toStrictEqual({ 
        lower: BigNumber.from(i), 
        upper: BigNumber.from(i + 1), 
        current: BigNumber.from(i + 2) 
      });
    }
  });
});
