import VaultsFetcher from "./vaults.fetcher";
import MockProvider from "./mock.provider";
import { Interface } from "@ethersproject/abi";
import { createAddress } from 'forta-agent-tools';
import abi from "./abi";
import { BigNumber } from "ethers";

const VAULT_IFACE: Interface = new Interface(abi.VAULT);
const REGISTRY_IFACE: Interface = new Interface(abi.REGISTRY);

const TEST_DATA: [string, number, number][] = [
  [createAddress("0xfee5"), 20, 42],
  [createAddress("0xdef1"), 30, 1],
  [createAddress("0xc0de"), 12, 420],
  [createAddress("0xf1a7"), 90, 20000],
  [createAddress("0xca11"), 11, 15],
]

const DEV: string[] = [
  createAddress("0xfee5"),
  createAddress("0xdef1"),
  createAddress("0xc0de"),  
]

const PROD: string[] = [
  createAddress("0xf1a7"),
  createAddress("0xca11"),
]

describe("VaultsFetcher tests suite", () => {
  const mockProvider = new MockProvider();
  const registry: string = createAddress("0xdead");
  const fetcher: VaultsFetcher = new VaultsFetcher(registry, mockProvider as any);

  const populateVaults = () => {
    for(let [vault, block, ratio] of TEST_DATA){
      mockProvider.addCallTo(
        vault,
        block,
        VAULT_IFACE,
        'getRatio',
        {inputs: [], outputs: [ratio]},
      );
    }
    mockProvider
      .addCallTo(
        registry,
        500,
        REGISTRY_IFACE,
        "developmentVaults",
        {inputs: [], outputs: [DEV]},
      )
      .addCallTo(
        registry,
        500,
        REGISTRY_IFACE,
        "productionVaults",
        {inputs: [], outputs: [PROD]},
      )
  };

  it("should set the registry", () => {
    for(let i = 0; i < 20; ++i){
      const addr: string = createAddress(`0x${i}`);
      const vaultsFetcher: VaultsFetcher = new VaultsFetcher(addr, mockProvider as any);
      expect(vaultsFetcher.registry).toStrictEqual(addr);
    }
  });
  
  it("should return the correct values", async () => {
    populateVaults();

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

  it("should return all the vaults", async () => {
    populateVaults();

    // get the vaults
    let vaults: string[] = await fetcher.getVaults(500);
    expect(vaults).toStrictEqual([...DEV, ...PROD]);

    // clear mock and use cached values
    vaults = await fetcher.getVaults(500);
    expect(vaults).toStrictEqual([...DEV, ...PROD]);
  });
});
