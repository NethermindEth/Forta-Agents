import DataFetcher from "./data.fetcher";
import {
  createAddress,
  MockEthersProvider,
} from "forta-agent-tools";
import { 
  moduleIFace,
  oracleIFace
} from "./abi";

describe("DataFetcher tests suite", () => {
  // format: [moduleAddress, blockNumber, oracleAddress, questionId, finalizeTS]
  const TEST_CASES: [string, number, string, string, number][] = [
    [
      createAddress("0x2d5ef8"), 2200000, createAddress("0xf33d4"),
      "0x81d50202a3f5c3971f123d9ddcca9c2c91d3e863019bdc3de8fcc2480ffadf02", 1500000
    ],
    [
      createAddress("0xf00d"), 2250000, createAddress("0xdef1"),
      "0x57c12963d94d1a2eec26eae9b064089728246725d507feb9e94a9703eb796a07", 1550000
    ],
    [
      createAddress("0x2d5ef8"), 2300000, createAddress("0xb33f"),
      "0x080f91de22bcdcd395d9f59ad1eb7d2bd851213f36ce88eee1b3321a275c8c2c", 1600000
    ],
    [
      createAddress("0xda456f"), 2350000, createAddress("0xf00b4"),
      "0x678e23012921e26c47439412244caa7bc94fed24e713c82d6cf16862911fe90e", 1650000
    ]
  ];

  const mockProvider: MockEthersProvider = new MockEthersProvider();

  function createMockOracleCall(
    module: string,
    blockNumber: number,
    oracleAddress: string
  ) {
    return mockProvider.addCallTo(
      module, blockNumber, moduleIFace,
      "oracle",
      { inputs:[], outputs:[oracleAddress] },
    );
  };

  function createMockGetFinalizeTSCall(
    blockNumber: number,
    oracleAddress: string,
    questionId: string,
    finalizeTS: number
  ) {
    return mockProvider.addCallTo(
      oracleAddress, blockNumber, oracleIFace,
      "getFinalizeTS",
      { inputs:[questionId], outputs:[finalizeTS] },
    );
  };
  
  beforeEach(() => mockProvider.clear());

  it("should store the correct module address", () => {
    for(let [module] of TEST_CASES) {
      const fetcher: DataFetcher = new DataFetcher(module, mockProvider as any);
      expect(fetcher.moduleAddress).toStrictEqual(module);
    }
  });

  it("should return the correct Oracle address", async() => {
    for(let [module, blockNumber, oracleAddress] of TEST_CASES) {
      const fetcher: DataFetcher = new DataFetcher(module, mockProvider as any);
      createMockOracleCall(module, blockNumber, oracleAddress);

      const fetchedOracleAddres: string = await fetcher.getOracle(blockNumber);
      expect(fetchedOracleAddres).toStrictEqual(oracleAddress);
    }
  });

  it("should return the correct Finalize Timestamp", async () => {
    for(let [module, blockNumber, oracleAddress, questionId, finalizeTS] of TEST_CASES) {
      const fetcher: DataFetcher = new DataFetcher(module, mockProvider as any);
      createMockGetFinalizeTSCall(blockNumber, oracleAddress, questionId, finalizeTS);

      const fetchedFinalizeTS: number = await fetcher.getFinalizeTS(
        blockNumber,
        oracleAddress,
        questionId
      );
      expect(fetchedFinalizeTS).toStrictEqual(finalizeTS);
    };
  });
});