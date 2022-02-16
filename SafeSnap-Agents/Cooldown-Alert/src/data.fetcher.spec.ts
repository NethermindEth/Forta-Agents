import DataFetcher from "./data.fetcher";
import {
    createAddress,
    MockEthersProvider,
} from "forta-agent-tools";
import { realitioIFace } from "./abi";

describe("DataFetcher tests suite", () => {
    const testRealitioErc20: string = createAddress("0x2d5ef8");
    const testQuestionId: string = "0x81d50202a3f5c3971f123d9ddcca9c2c91d3e863019bdc3de8fcc2480ffadf02";
    const testFinalizeTS: number = 1500000;

    const testBlockNumber: number = 2200000;

    const mockProvider: MockEthersProvider = new MockEthersProvider();
    const fetcher: DataFetcher = new DataFetcher(testRealitioErc20, mockProvider as any);
    
    beforeEach(() => mockProvider.clear());

  it("should store the correct Realitio contract", () => {
    for(let i = 0; i < 10; ++i){
      const testRealitio: string = createAddress(`0xf00${i}`);
      const fetcher: DataFetcher = new DataFetcher(testRealitio, mockProvider as any);

      expect(fetcher.realitio).toStrictEqual(testRealitio);
    }
  });

  it("should return the correct Finalize Timestamp", async () => {
    mockProvider.addCallTo(
        testRealitioErc20, testBlockNumber, realitioIFace,
        "getFinalizeTS",
        { inputs:[testQuestionId], outputs:[testFinalizeTS] },
    );

    let finalizeTS: number = await fetcher.getFinalizeTS(testBlockNumber, testQuestionId);
    expect(finalizeTS).toStrictEqual(testFinalizeTS);

    // clear mock to ensure cache usage
    mockProvider.clear();

    finalizeTS = await fetcher.getFinalizeTS(testBlockNumber, testQuestionId);
    expect(finalizeTS).toStrictEqual(testFinalizeTS);
  });
});