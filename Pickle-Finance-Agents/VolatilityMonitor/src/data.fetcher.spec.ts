import MockProvider from "./mock.provider";
import DataFetcher from "./data.fetcher";
import { createAddress } from "forta-agent-tools";
import { Interface } from "@ethersproject/abi";
import abi from "./abi";
import { utils } from "ethers";

const REGISTRY_IFACE: Interface =  new Interface(abi.REGISTRY); 
const KEEPER_IFACE: Interface =  new Interface(abi.KEEPER); 

describe("DataFetcher tests suite", () => {
  const registry: string = createAddress("0xDA0");
  const mockProvider: MockProvider = new MockProvider();
  const fetcher: DataFetcher = new DataFetcher(registry, mockProvider as any);

  const getUpkeepParams = (target: string) => [
    target,
    // random params not used in the agent
    1, "0x12", 1,
    createAddress('0xdead1'),
    createAddress('0xdead2'),
    1,
  ];

  beforeEach(() => mockProvider.clear());

  it("should store the correct keeper", () => {
    for(let i = 0; i < 10; ++i){
      const addr: string = createAddress(`0xDA0${i}`);
      const fetcher: DataFetcher = new DataFetcher(addr, mockProvider as any);

      expect(fetcher.registry).toStrictEqual(addr);
    }
  });

  it("should return the correct upkeep address", async () => {
    const CASES: [number, number, string][] = [
      [42, 99, "0xDEF1"],
      [20, 2000, "0xFEE"],
      [111, 1, "0xDA0"],
    ];
    for(let [id, block, addr] of CASES) {
      const keeper: string = createAddress(addr);

      mockProvider.addCallTo(
        registry, block, REGISTRY_IFACE, 'getUpkeep',
        { inputs: [id], outputs: getUpkeepParams(keeper) },
      );

      let address: string = await fetcher.getUpkeep(block, id);
      expect(address).toStrictEqual(keeper.toLowerCase());

      // clear mock to ensure cache usage
      mockProvider.clear();

      address = await fetcher.getUpkeep(block, id);
      expect(address).toStrictEqual(keeper.toLowerCase());
    }
  });

  it("should return the correct upkeep address", async () => {
    const CASES: [string, number, number][] = [
      ["0xDEF1", 5, 1],
      ["0xFEE", 2, 2],
      ["0xDA0", 20, 3],
    ];
    for(let [addr, length, block] of CASES) {
      const keeper: string = createAddress(addr);
      const strategies: string[] = [];

      mockProvider.addStorage(
        keeper, 0, block, 
        utils.defaultAbiCoder.encode(["uint256"], [length]),
      );

      while(length--){
        const strat: string = createAddress(`0xFA17${length}`);
        mockProvider.addCallTo(
          keeper, block, KEEPER_IFACE, "strategyArray",
          { inputs:[strategies.length], outputs: [strat]}
        )
        strategies.push(strat.toLowerCase());
      }

      let addresses: string[] = await fetcher.getStrategies(block, keeper);
      expect(addresses).toStrictEqual(strategies);

      // clear mock to ensure cache usage
      mockProvider.clear();

      addresses = await fetcher.getStrategies(block, keeper);
      expect(addresses).toStrictEqual(strategies);
    }
  });
});
