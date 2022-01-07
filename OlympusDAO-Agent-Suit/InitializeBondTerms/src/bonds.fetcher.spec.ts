import { providers, utils as ethers } from "ethers";
import { createAddress } from "forta-agent-tools";
import BondsFetcher from "./bonds.fetcher";
import MockProvider from "./mock.provider";
import utils from "./utils";

const BONDS: string[] = [
  createAddress("0xdef1a"),
  createAddress("0xdef1b"),
  createAddress("0xdef1c"),
  createAddress("0xdef1d"),
];
const ENCODED_LENGHT: string = ethers.defaultAbiCoder.encode(['uint256'], [BONDS.length]);

describe("BondsFetcher tests suite", () => {
  const mockProvider: MockProvider = new MockProvider();
  const helper: string = createAddress("0xF00");

  const initBlock = (block: number) => {
    for(let i = 0; i < BONDS.length; ++i){
      mockProvider.addCallTo(
        helper, 
        block, 
        utils.REDEEM_HELPER_IFACE, 
        "bonds", 
        {inputs:[i], outputs:[BONDS[i]]},
      );
    };
    mockProvider.addStorage(helper, 2, block, ENCODED_LENGHT);
  };

  beforeEach(() => mockProvider.clear());

  it("should store the redeemHelper address correctly", async () => {
    for(let i = 0; i < 10; ++i){
      const addr: string = createAddress(`0xDA0${i}`);
      const fetcher: BondsFetcher = new BondsFetcher(addr, mockProvider as any);

      expect(fetcher.redeemHelper).toStrictEqual(addr);
    }
  });

  it("should fetch the bonds", async () => {
    initBlock(20);
    const fetcher: BondsFetcher = new BondsFetcher(helper, mockProvider as any);

    let bonds: string[] = (await fetcher.getBondsContracts(20));
    expect(bonds).toStrictEqual(BONDS);

    // clear mocks
    mockProvider.clear();

    // use cached values
    bonds = await fetcher.getBondsContracts(20);
    expect(bonds).toStrictEqual(BONDS);
  });

  it("should fetch the correct amount of bonds", async () => {
    initBlock(42);
    mockProvider.addStorage(
      helper, 2, 42, 
      ethers.defaultAbiCoder.encode(['uint256'], [2]),
    );
    const fetcher: BondsFetcher = new BondsFetcher(helper, mockProvider as any);

    let bonds: string[] = (await fetcher.getBondsContracts(42));
    expect(bonds).toStrictEqual(BONDS.slice(0, 2));

    // clear mocks
    mockProvider.clear();

    // use cached values
    bonds = await fetcher.getBondsContracts(42);
    expect(bonds).toStrictEqual(BONDS.slice(0, 2));
  });
});
