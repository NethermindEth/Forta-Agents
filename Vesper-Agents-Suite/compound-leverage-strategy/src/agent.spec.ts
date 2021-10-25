import { Finding, HandleBlock } from "forta-agent";
import {
  createMockContractGenerator,
  mockAddressList,
  mockComptroller,
  mockController,
  mockPool,
  mockStrategy,
} from "./mock";
import {
  createAddress,
  encodeParameter,
  TestBlockEvent,
} from "forta-agent-tools";
import {
  vesperControllerAddress,
  comptrollerAddress,
  createFindingForLiquidationWarning,
  createFindingForHighCurrentBorrowRatio,
} from "./utils";
import { provideHandleBlock } from "./agent";

const addressListAddress = createAddress("0x1");

const cTokenAddress = createAddress("0x12");

const v2Pools = [createAddress("0x2"), createAddress("0x3")];

const v3Pools = [createAddress("0x4"), createAddress("0x5")];

const strategies = {
  [createAddress("0x6")]: new mockStrategy("Pool1"),
  [createAddress("0x7")]: new mockStrategy("Pool2"),
  [createAddress("0x8")]: new mockStrategy("Pool3"),
  [createAddress("0x9")]: new mockStrategy("Compound-Leverage1"),
  [createAddress("0x10")]: new mockStrategy("Compound-Leverage2"),
  [createAddress("0x11")]: new mockStrategy("Pool4"),
};

const strategyPerPoolV2 = {
  [v2Pools[0]]: createAddress("0x6"),
  [v2Pools[1]]: createAddress("0x7"),
};

const strategiesPerPoolV3 = {
  [v3Pools[0]]: [createAddress("0x8"), createAddress("0x9")],
  [v3Pools[1]]: [createAddress("0x10"), createAddress("0x11")],
};

const mockContracts: any = {
  [vesperControllerAddress]: new mockController(
    addressListAddress,
    strategyPerPoolV2 as any
  ),
  [addressListAddress]: new mockAddressList([...v2Pools, ...v3Pools]),
  [comptrollerAddress]: new mockComptroller(),
};

const addPoolsContracts = () => {
  for (let v2Pool of v2Pools) {
    mockContracts[v2Pool] = new mockPool([]);
  }

  for (let v3Pool of v3Pools) {
    mockContracts[v3Pool] = new mockPool(strategiesPerPoolV3[v3Pool]);
  }
};

const addStrategyContracts = () => {
  for (let strategyAddress in strategies) {
    mockContracts[strategyAddress] = strategies[strategyAddress];
  }
};

const mockWeb3 = {
  eth: {
    Contract: createMockContractGenerator(mockContracts),
    getStorageAt: () => encodeParameter("address", cTokenAddress),
  },
};

describe("Compound Leverage Agent Tests", () => {
  let handleBlock: HandleBlock;
  let compoundLeverage1: mockStrategy;
  let compoundLeverage2: mockStrategy;
  let comptroller: mockComptroller;

  beforeAll(() => {
    addPoolsContracts();
    addStrategyContracts();

    compoundLeverage1 = mockContracts[createAddress("0x9")];
    compoundLeverage2 = mockContracts[createAddress("0x10")];
    comptroller = mockContracts[comptrollerAddress];

    handleBlock = provideHandleBlock(mockWeb3 as any);
  });

  it("should returns empty finding if currentBorrowRatio is ok", async () => {
    compoundLeverage1.setCurrentBorrowRatio("6000");
    compoundLeverage1.setRangeBorrowRatio("2000", "8000");
    compoundLeverage2.setCurrentBorrowRatio("6000");
    compoundLeverage2.setRangeBorrowRatio("2000", "8000");
    comptroller.setMarketInfo(cTokenAddress, "9000000000000000000");

    const findings: Finding[] = await handleBlock(new TestBlockEvent());

    expect(findings).toStrictEqual([]);
  });

  it("should returns finding if current ratio is greater than max ratio", async () => {
    compoundLeverage1.setCurrentBorrowRatio("7000");
    compoundLeverage1.setRangeBorrowRatio("2000", "6000");
    compoundLeverage2.setCurrentBorrowRatio("6000");
    compoundLeverage2.setRangeBorrowRatio("2000", "8000");
    comptroller.setMarketInfo(cTokenAddress, "900000000000000000");

    const findings: Finding[] = await handleBlock(new TestBlockEvent());

    expect(findings).toStrictEqual([
      createFindingForHighCurrentBorrowRatio(
        createAddress("0x9"),
        BigInt("7000"),
        BigInt("6000")
      ),
    ]);
  });

  it("should returns finding if current ratio is too close to collateral factor", async () => {
    compoundLeverage1.setCurrentBorrowRatio("8000");
    compoundLeverage1.setRangeBorrowRatio("2000", "9000");
    compoundLeverage2.setCurrentBorrowRatio("6000");
    compoundLeverage2.setRangeBorrowRatio("2000", "8000");
    comptroller.setMarketInfo(cTokenAddress, "900000000000000000");

    const findings: Finding[] = await handleBlock(new TestBlockEvent());

    expect(findings).toStrictEqual([
      createFindingForLiquidationWarning(
        createAddress("0x9"),
        BigInt("800000000000000000"),
        BigInt("900000000000000000")
      ),
    ]);
  });

  it("should returns findings from multiple strategies", async () => {
    compoundLeverage1.setCurrentBorrowRatio("6000");
    compoundLeverage1.setRangeBorrowRatio("2000", "5000");
    compoundLeverage2.setCurrentBorrowRatio("8000");
    compoundLeverage2.setRangeBorrowRatio("2000", "8000");
    comptroller.setMarketInfo(cTokenAddress, "900000000000000000");

    const findings: Finding[] = await handleBlock(new TestBlockEvent());

    expect(findings).toStrictEqual([
      createFindingForHighCurrentBorrowRatio(
        createAddress("0x9"),
        BigInt("6000"),
        BigInt("5000")
      ),
      createFindingForLiquidationWarning(
        createAddress("0x10"),
        BigInt("800000000000000000"),
        BigInt("900000000000000000")
      ),
    ]);
  });

  it("should returns multiple findings from the same strategy", async () => {
    compoundLeverage1.setCurrentBorrowRatio("9000");
    compoundLeverage1.setRangeBorrowRatio("2000", "5000");
    compoundLeverage2.setCurrentBorrowRatio("7000");
    compoundLeverage2.setRangeBorrowRatio("2000", "8000");
    comptroller.setMarketInfo(cTokenAddress, "900000000000000000");

    const findings: Finding[] = await handleBlock(new TestBlockEvent());

    expect(findings).toStrictEqual([
      createFindingForHighCurrentBorrowRatio(
        createAddress("0x9"),
        BigInt("9000"),
        BigInt("5000")
      ),
      createFindingForLiquidationWarning(
        createAddress("0x9"),
        BigInt("900000000000000000"),
        BigInt("900000000000000000")
      ),
    ]);
  });
});
