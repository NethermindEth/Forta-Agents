import PPSFetcher from "./pps.fetcher";
import MockProvider from "./mock.provider";
import { Interface } from "@ethersproject/abi";
import { createAddress } from 'forta-agent-tools';
import utils from "./utils";
import { BigNumber } from "ethers";

const IFACE: Interface = new Interface(utils.VAULT_ABI);

const TEST_DATA: [string, number, number][] = [
  [createAddress("0xfee5"), 20, 42],
  [createAddress("0xdef1"), 30, 1],
  [createAddress("0xc0de"), 12, 420],
  [createAddress("0xf1a7"), 90, 20000],
  [createAddress("0xca11"), 11, 15],
]

describe("PPSFetcher tests suite", () => {
  const mockProvider = new MockProvider();
  const fetcher: PPSFetcher = new PPSFetcher(mockProvider as any);

  const populateMock = () => {
    for(let [vault, block, ratio] of TEST_DATA){
      mockProvider.addCallTo(
        vault,
        block,
        IFACE,
        'getRatio',
        {inputs: [], outputs: [ratio]},
      );
    }
  };
  
  it("should return the correct values", async () => {
    populateMock();

    // check all the test cases
    for(let [vault, block, ratio] of TEST_DATA){
      const value: BigNumber = await fetcher.getPPS(block, vault);
      expect(value).toStrictEqual(BigNumber.from(ratio));
    }

    // clear mock and use cached values
    mockProvider.clear();
    for(let [vault, block, ratio] of TEST_DATA){
      const value: BigNumber = await fetcher.getPPS(block, vault);
      expect(value).toStrictEqual(BigNumber.from(ratio));
    }
  });
});
