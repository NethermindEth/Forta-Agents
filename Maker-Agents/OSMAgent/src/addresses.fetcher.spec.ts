import AddressesFetcher from "./addresses.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { CHAIN_LOG, FUNCTIONS_ABIS } from "./utils";
import { formatBytes32String, Interface } from "ethers/lib/utils";

describe("AddressesFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: AddressesFetcher 
  ;
  const CONTRACTS: Map<string,string> = new Map<string,string> ([
    [formatBytes32String("PIP_ONE"),createAddress("0xa1") ],
    [formatBytes32String("PIP_TWO"),createAddress("0xa2") ],
    [formatBytes32String("PIP_THREE"),createAddress("0xa3") ],
    [formatBytes32String("NOPIP_ONE"),createAddress("0xa4") ],
    [formatBytes32String("NOPIP_TWO"),createAddress("0xa5") ],
    [formatBytes32String("NOPIP_THREE"),createAddress("0xa6") ],
  ])

  const initialize = () => {
    fetcher = new AddressesFetcher(mockProvider as any, CHAIN_LOG);
    mockProvider.clear()
    
    // call to list 
    mockProvider.addCallTo(CHAIN_LOG, 1, new Interface(FUNCTIONS_ABIS), "list", {
        inputs: [],
        outputs: [ Array.from(CONTRACTS.keys())],

    })
    // call to getAddress 
    CONTRACTS.forEach((address,key)=>{
      mockProvider.addCallTo(CHAIN_LOG, 1,  new Interface(FUNCTIONS_ABIS), "getAddress", {
        inputs: [key],
        outputs: [address.toLowerCase()],
      });
    });
  };

  it("should store only PIP_ prefixed addresses", async () => {
    initialize()
    await fetcher.getOsmAddresses(1);

    expect (fetcher.osmContracts).toStrictEqual(new Map<string,string>([
        [formatBytes32String("PIP_ONE"),createAddress("0xa1") ],
        [formatBytes32String("PIP_TWO"),createAddress("0xa2") ],
        [formatBytes32String("PIP_THREE"),createAddress("0xa3") ],
    ]))


  });

  it("should update the addresses correctly", async () => {
    initialize()
    await fetcher.getOsmAddresses(1);
    fetcher.updateAddresses("UpdateAddress",  [formatBytes32String("PIP_FOUR"),createAddress("0xa7") ])
    expect (fetcher.osmContracts).toStrictEqual(new Map<string,string>([
        [formatBytes32String("PIP_ONE"),createAddress("0xa1") ],
        [formatBytes32String("PIP_TWO"),createAddress("0xa2") ],
        [formatBytes32String("PIP_THREE"),createAddress("0xa3") ],
        [formatBytes32String("PIP_FOUR"),createAddress("0xa7") ],
    ]))
    
    fetcher.updateAddresses("RemoveAddress",[formatBytes32String("PIP_ONE")] )
    expect (fetcher.osmContracts).toStrictEqual(new Map<string,string>([
        [formatBytes32String("PIP_TWO"),createAddress("0xa2") ],
        [formatBytes32String("PIP_THREE"),createAddress("0xa3") ],
        [formatBytes32String("PIP_FOUR"),createAddress("0xa7") ]
    ]))
});
});