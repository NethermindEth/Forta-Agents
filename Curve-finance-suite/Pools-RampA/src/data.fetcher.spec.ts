import { createAddress } from "forta-agent-tools";
import DataFetcher from "./data.fetcher";
import MockProvider from "./mock.provider";
import abi from "./abi";


describe("DataFetcher tests suite", () => {
  const mockProvider: MockProvider = new MockProvider();

  beforeEach(() => mockProvider.clear());

  it("should return the address provider", async () => {
    const providers: string[] = [
      createAddress("0x20"),
      createAddress("0xdead"),
      createAddress("0xcafe"),
      createAddress("0x123"),
    ];

    for(let addr of providers){
      const fetcher: DataFetcher = new DataFetcher(addr, mockProvider);
      expect(fetcher.addrProvider).toStrictEqual(addr);
    }
  });

  it("should return and save the registry", async () => {
    const provider: string = createAddress("0xdead");
    const registry: string = createAddress("0xcafe");
    const fetcher: DataFetcher = new DataFetcher(provider, mockProvider);

    mockProvider.addCallTo(
      provider,
      2222,
      abi.PROVIDER_IFACE,
      "get_registry",
      { inputs: [], outputs: [registry] },
    );

    expect(await fetcher.getRegistry(2222)).toStrictEqual(registry);

    // clear the mock
    mockProvider.clear();

    // using cached value
    expect(await fetcher.getRegistry(2222)).toStrictEqual(registry);
  });

  it("should verify the pools", async () => {
    const provider: string = createAddress("0xdead1");
    const registry1: string = createAddress("0xcafe1");
    const registry2: string = createAddress("0xcafe2");
    const pool1: string = createAddress("0xfe1");
    const pool2: string = createAddress("0xfe2");
    const fetcher: DataFetcher = new DataFetcher(provider, mockProvider);

    mockProvider
      .addCallTo(
        provider,
        1,
        abi.PROVIDER_IFACE,
        "get_registry",
        { inputs: [], outputs: [registry1] },
      )
      .addCallTo(
        provider,
        2,
        abi.PROVIDER_IFACE,
        "get_registry",
        { inputs: [], outputs: [registry2] },
      )
      .addCallTo(
        registry1,
        1,
        abi.REGISTRY_IFACE,
        "get_pool_name",
        { inputs: [pool1], outputs: [""] },
      )
      .addCallTo(
        registry1,
        1,
        abi.REGISTRY_IFACE,
        "get_pool_name",
        { inputs: [pool2], outputs: ["some-name"] },
      )
      .addCallTo(
        registry2,
        2,
        abi.REGISTRY_IFACE,
        "get_pool_name",
        { inputs: [pool1], outputs: ["pool-3000"] },
      )
      .addCallTo(
        registry2,
        2,
        abi.REGISTRY_IFACE,
        "get_pool_name",
        { inputs: [pool2], outputs: ["some-cool-name"] },
      );

    expect(await fetcher.isPool(pool1, 1)).toStrictEqual(false);
    expect(await fetcher.isPool(pool2, 1)).toStrictEqual(true);
    expect(await fetcher.isPool(pool1, 2)).toStrictEqual(true);
    expect(await fetcher.isPool(pool2, 2)).toStrictEqual(true);

    // clear the mock
    mockProvider.clear();

    // using cached value
    expect(await fetcher.isPool(pool1, 1)).toStrictEqual(false);
    expect(await fetcher.isPool(pool2, 1)).toStrictEqual(true);
    expect(await fetcher.isPool(pool1, 2)).toStrictEqual(true);
    expect(await fetcher.isPool(pool2, 2)).toStrictEqual(true);
  });
});
