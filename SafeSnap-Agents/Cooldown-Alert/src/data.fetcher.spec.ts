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
    const testOracle: string = createAddress("0xf33d4");
    const testFinalizeTS: number = 1500000;

    const testModules: string[] = [
      createAddress("0x2d5ef8"),
      createAddress("0xf00d"),
      createAddress("0x2d5ef8"),
      createAddress("0xda456f")
    ];
    const testBlockNumbers: number[] = [
      2200000,
      2250000,
      2300000,
      2350000
    ];
    // format: [blockNumber, oracleAddress, questionId]
    const CASES: [number, string, string][] = [
      [testBlockNumbers[0], testOracle, "0x81d50202a3f5c3971f123d9ddcca9c2c91d3e863019bdc3de8fcc2480ffadf02"],
      [testBlockNumbers[1], createAddress("0xdef1"), "0x57c12963d94d1a2eec26eae9b064089728246725d507feb9e94a9703eb796a07"],
      [testBlockNumbers[2], createAddress("0xb33f"), "0x080f91de22bcdcd395d9f59ad1eb7d2bd851213f36ce88eee1b3321a275c8c2c"],
      [testBlockNumbers[3], createAddress("0xf00b4"), "0x678e23012921e26c47439412244caa7bc94fed24e713c82d6cf16862911fe90e"]
    ];

    const mockProvider: MockEthersProvider = new MockEthersProvider();

    function createMockOracleCall(blockNumber: number) {
      return mockProvider.addCallTo(
        testModules[0], blockNumber, moduleIFace,
        "oracle",
        { inputs:[], outputs:[testOracle] },
      );
    };

    function createMockGetFinalizeTSCall(
      blockNumber: number,
      oracleAddress: string,
      questionId: string
    ) {
      return mockProvider.addCallTo(
        oracleAddress, blockNumber, oracleIFace,
        "getFinalizeTS",
        { inputs:[questionId], outputs:[testFinalizeTS] },
      );
    }

    const fetcher: DataFetcher = new DataFetcher(testModules[0], mockProvider as any);
    
    beforeEach(() => mockProvider.clear());

  it("should store the correct module address", () => {
    for(let module of testModules) {
      const fetcherTwo: DataFetcher = new DataFetcher(module, mockProvider as any);
      expect(fetcherTwo.moduleAddress).toStrictEqual(module);
    }
  });

  it("should return the correct Oracle address", async() => {
    for(let blockNumber of testBlockNumbers) {
      createMockOracleCall(blockNumber);

      const oracleAddress: string = await fetcher.getOracle(blockNumber);
      expect(oracleAddress).toStrictEqual(testOracle);
    }
  });

  it("should return the correct Finalize Timestamp", async () => {
    for(let [blockNumber, oracleAddress, questionId] of CASES) {
      createMockGetFinalizeTSCall(blockNumber, oracleAddress, questionId);

      const finalizeTS: number = await fetcher.getFinalizeTS(
        blockNumber,
        oracleAddress,
        questionId
      );
      expect(finalizeTS).toStrictEqual(testFinalizeTS);
    };
  });
});