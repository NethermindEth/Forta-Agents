import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { ethers } from "ethers";
import TokenFetcher from "./token.fetcher";
import { IBEP20_ABI } from "./constants";

describe("Token Fetcher test suite", () => {

  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockMasterchefAddress = createAddress("0x5");
  const mockLPTokenAddress = createAddress("0x6");
  const IBEP20_INTERFACE = new ethers.utils.Interface(IBEP20_ABI);

  const fetcher: TokenFetcher = new TokenFetcher(mockProvider as any, mockLPTokenAddress);

  function createNameCall(
    lpTokenAddress: string,
    name: string,
    block: string | number
  ) {
    return mockProvider.addCallTo(lpTokenAddress, block, IBEP20_INTERFACE, "name", {
      inputs: [],
      outputs: [name]
    })
  }

  function createBalanceOfCall(
    masterchefAddress: string, 
    lpTokenAddress: string,
    balance: number,
    block: string | number) {
    return mockProvider.addCallTo(lpTokenAddress, block, IBEP20_INTERFACE, "balanceOf", {
        inputs: [masterchefAddress],
        outputs: [balance]
    })
  }

  it("should return the correct LP Token Name", async () => {

    const mockLPTokenName = 'Test Token 1';
    createNameCall(mockLPTokenAddress, mockLPTokenName, 100);
    const fetchedLPTokenName: string = await fetcher.getName(100);
    expect(fetchedLPTokenName).toStrictEqual(mockLPTokenName);

    // clear mock to use cache
    mockProvider.clear();
    createNameCall(mockLPTokenAddress, mockLPTokenName, 100);
    const fetchedLPTokenName2: string = await fetcher.getName(100);
    expect(fetchedLPTokenName2).toStrictEqual(mockLPTokenName);
    
  });

  it("should return the correct balance of the Masterchef address", async () => {

    const mockMasterchefBalance = 12345;
    createBalanceOfCall(mockMasterchefAddress, mockLPTokenAddress, mockMasterchefBalance, 100);
    const fetchedMasterchefBalance: string = await fetcher.getBalanceOf(mockMasterchefAddress, 100);
    expect(fetchedMasterchefBalance).toStrictEqual(mockMasterchefBalance);

    // clear mock to use cache
    mockProvider.clear();
    createBalanceOfCall(mockMasterchefAddress, mockLPTokenAddress, mockMasterchefBalance, 100);
    const fetchedMasterchefBalance2: string = await fetcher.getBalanceOf(mockMasterchefAddress, 100);
    expect(fetchedMasterchefBalance2).toStrictEqual(mockMasterchefBalance);
    
  });
});