import { MockEthersProvider } from "forta-agent-tools/lib/test";
import DataFetcher from "./data.fetcher";
import { createAddress } from "forta-agent-tools";
import { when } from "jest-when";
import { SYMBOL_ABI } from "./utils";
import { Interface } from "ethers/lib/utils";

jest.mock("node-fetch");

// [code, address, isEOA]
const TEST_RECEIVERS: [string, string, boolean][] = [
  ["0x", createAddress("0xa1"), true],
  ["0xababa", createAddress("0xa2"), false],
  ["0x", createAddress("0xa3"), true],
  ["0x", createAddress("0xa4"), true],
  ["0xccc", createAddress("0xa5"), false],
];

const SYMBOL_IFACE = new Interface(SYMBOL_ABI);

/// [symbol, blockNumber, tokenAddress]
const TEST_SYMBOLS: [number, string, string][] = [
  [1, "ABC", createAddress("0x1")],
  [2, "BCD", createAddress("0x2")],
  [3, "DEF", createAddress("0x3")],
  [4, "FEG", createAddress("0x4")],
  [5, "GHI", createAddress("0x5")],
];

class MockEthersProviderExtended extends MockEthersProvider {
  public getCode: any;

  constructor() {
    super();
    this.getCode = jest.fn();
  }

  public setCode(address: string, code: string): MockEthersProviderExtended {
    when(this.getCode).calledWith(address).mockReturnValue(Promise.resolve(code));
    return this;
  }
}

describe("DatFetcher tests suite", () => {
  const mockProvider: MockEthersProviderExtended = new MockEthersProviderExtended();
  let fetcher: DataFetcher;

  beforeAll(() => {
    fetcher = new DataFetcher(mockProvider as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return if the receiver is an EOA or not and use cache correctly", async () => {
    for (let [code, address, isEoa] of TEST_RECEIVERS) {
      mockProvider.setCode(address, code);
      const fetchedIsEoa = await fetcher.isEoa(address);
      expect(fetchedIsEoa).toStrictEqual(isEoa);
    }

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [, address, isEoa] of TEST_RECEIVERS) {
      const fetchedIsEoa = await fetcher.isEoa(address);
      expect(fetchedIsEoa).toStrictEqual(isEoa);
    }

    mockProvider.clear();
  });

  it("should return correct symbols", async () => {
    for (let [block, symbol, tokenAddress] of TEST_SYMBOLS) {
      mockProvider.addCallTo(tokenAddress, block, SYMBOL_IFACE, "symbol", {
        inputs: [],
        outputs: [symbol],
      });
      const fetchedSymbol = await fetcher.getSymbol(tokenAddress, block);

      expect(fetchedSymbol).toStrictEqual(symbol.toLowerCase());
    }
    expect(mockProvider.call).toBeCalledTimes(5);
  });
});
