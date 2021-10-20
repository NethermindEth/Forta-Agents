import VesperFetcher from "./vesper.fetcher";
import vesper from "./vesper.mock"

describe("VesperFetcher tests suite", () => {
  const mockWeb3Call = jest.fn();
  const fetcher: VesperFetcher = new VesperFetcher(mockWeb3Call, vesper.CONTROLLER);

  beforeAll(() => {
    vesper.initMock(mockWeb3Call);
  });

  it("should return all the pools in the controller", async () => {
    const pools: string[] = await fetcher.getPools();
    expect(pools).toStrictEqual(vesper.POOLS);
  });

  it("should return all the V2 strategies", async () => {
    const strategies: string[] = await fetcher.getStrategiesV2();
    expect(strategies).toStrictEqual(vesper.STRATEGIES_V2);
  });

  it("should return all the V3 strategies", async () => {
    const strategies: string[] = await fetcher.getStrategiesV3();
    expect(strategies).toStrictEqual(vesper.STRATEGIES_V3);
  });

  it("should return all the strategies", async () => {
    const strategies: string[] = await fetcher.getAllStrategies();
    expect(strategies).toStrictEqual(vesper.STRATEGIES);
  });
});
