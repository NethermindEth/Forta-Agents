import RegistryFetcher from "./registry.fetcher";
import MockProvider from "./mock.provider";
import { utils } from "ethers";
import abi from "./abi";
import { createAddress } from "forta-agent-tools";

const PROVIDERS: string[] = [];
const REGISTRYS: string[] = [];

describe("RegistryFetcher tests suite", () => {
  beforeAll(() => {
    for(let i = 0; i <= 10; ++i){
      PROVIDERS.push(createAddress(`0xa${i}`));
      REGISTRYS.push(createAddress(`0xb${i}`));
    }
  });

  it('should set the address provider correctly', async () => {
    for(let addr of PROVIDERS){
      const fetcher: RegistryFetcher = new RegistryFetcher(addr, undefined);
      expect(fetcher.addrProvider).toStrictEqual(addr);
    }
  });

  it('should return the correct registry', async () => {
    const mockProvider: MockProvider = new MockProvider();
    const iface: utils.Interface = new utils.Interface(abi.PROVIDER);

    for(let i = 0; i <= 10; ++i){
      mockProvider.addCallTo(
        PROVIDERS[i],
        i,
        iface,
        "get_registry",
        {
          inputs: [],
          outputs: [REGISTRYS[i]],
        },
      );
      const fetcher: RegistryFetcher = new RegistryFetcher(PROVIDERS[i], mockProvider);
      expect(await fetcher.getRegistry(i)).toStrictEqual(REGISTRYS[i]);

      // clear mock to ensure cache usage or failure
      mockProvider.clear();
      expect(await fetcher.getRegistry(i)).toStrictEqual(REGISTRYS[i]);
    }
  });
});
