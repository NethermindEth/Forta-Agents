import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { ethers } from "ethers";
import MasterchefFetcher from "./masterchef.fetcher";
import { MASTERCHEF_ABI } from "./constants";

describe("Masterchef Fetcher test suite", () => {

  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockMasterchefAddress = createAddress("0x5");
  const mockLPTokenAddress = createAddress("0x6");
  const MASTERCHEF_INTERFACE = new ethers.utils.Interface(MASTERCHEF_ABI);

  const fetcher: MasterchefFetcher = new MasterchefFetcher(mockProvider as any, mockMasterchefAddress);

  function createLPTokenCall(
    masterchefAddress: string, 
    lpTokenAddress: string,
    pid: string | number, 
    block: string | number) {
    return mockProvider.addCallTo(masterchefAddress, block, MASTERCHEF_INTERFACE, "lpToken", {
        inputs: [pid],
        outputs: [lpTokenAddress]
    })
  }

  it("should return the correct LP Token Address", async () => {
    
    createLPTokenCall(mockMasterchefAddress, mockLPTokenAddress, 10, 100);
    const fetchedLPTokenAddress: string = await fetcher.getLPToken(10, 100);
    expect(fetchedLPTokenAddress).toStrictEqual(mockLPTokenAddress);

    // clear mock to use cache
    mockProvider.clear();
    createLPTokenCall(mockMasterchefAddress, mockLPTokenAddress, 10, 100);
    const fetchedLPTokenAddressCache: string = await fetcher.getLPToken(10, 100);
    expect(fetchedLPTokenAddressCache).toStrictEqual(mockLPTokenAddress);
  });
});