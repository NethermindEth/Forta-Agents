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
    const testModule: string = createAddress("0x2d5ef8");
    const testBlockNumber: number = 2200000;
    const testOracle: string = createAddress("0xf33d4");

    const testQuestionId: string = "0x81d50202a3f5c3971f123d9ddcca9c2c91d3e863019bdc3de8fcc2480ffadf02";
    const testFinalizeTS: number = 1500000;

    const mockProvider: MockEthersProvider = new MockEthersProvider();
    const fetcher: DataFetcher = new DataFetcher(testModule, mockProvider as any);
    
    beforeEach(() => mockProvider.clear());

  it("should store the correct module address", () => {
    for(let i = 0; i < 10; ++i){
      const testModuleTwo: string = createAddress(`0xf00${i}`);
      const fetcherTwo: DataFetcher = new DataFetcher(testModuleTwo, mockProvider as any);

      expect(fetcherTwo.moduleAddress).toStrictEqual(testModuleTwo);
    }
  });

  it("should return the correct Oracle address", async() => {
    mockProvider.addCallTo(
      testModule, testBlockNumber, moduleIFace,
      "oracle",
      { inputs:[], outputs:[testOracle] },
    );

    const oracleAddress: string = await fetcher.getOracle(testBlockNumber)
    expect(oracleAddress).toStrictEqual(testOracle);
  })

  it("should return the correct Finalize Timestamp", async () => {
    mockProvider.addCallTo(
      testModule, testBlockNumber, moduleIFace,
      "oracle",
      { inputs:[], outputs:[testOracle] },
    );
    mockProvider.addCallTo(
      testOracle, testBlockNumber, oracleIFace,
      "getFinalizeTS",
      { inputs:[testQuestionId], outputs:[testFinalizeTS] },
    );

    const oracleAddress: string = await fetcher.getOracle(testBlockNumber)

    const finalizeTS: number = await fetcher.getFinalizeTS(
      testBlockNumber,
      oracleAddress,
      testQuestionId
    );

    expect(finalizeTS).toStrictEqual(testFinalizeTS);
  });
});