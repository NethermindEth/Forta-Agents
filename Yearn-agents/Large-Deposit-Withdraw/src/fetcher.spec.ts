import VaultsFetcher, { VAULT_ABI } from './fetcher';
import { createAddress, encodeFunctionCall, encodeParameter } from 'forta-agent-tools';
import { when } from 'jest-when';


const provider: string = createAddress("0xdead");
const param = {
  to: provider,
  data: encodeFunctionCall(VAULT_ABI, []),
}


const updateMock = (mock:any, block: any, output:string[]): void => {
  when(mock)
    .calledWith(param, block)
    .mockReturnValue(encodeParameter("address[]", output));
};


describe("Valuts fetcher tests suite", () => {
  const mockCall: any = jest.fn();
  const mockWeb3: any = {
    call: mockCall,
  }
  const fetcher: VaultsFetcher = new VaultsFetcher(provider, mockWeb3);

  it("should return expected values", async () => {
    const vaults0: string[] = [
      createAddress("0x0"),
      createAddress("0x1"),
      createAddress("0x2"),
    ];
    const vaults1: string[] = [
      createAddress("0xcafe"),
    ];
    const vaults2: string[] = [
      createAddress("0xa0"),
      createAddress("0xa1"),
    ];

    // initialize mock
    updateMock(mockCall, 1, vaults0);
    updateMock(mockCall, 2, vaults1);
    updateMock(mockCall, 3, vaults2);

    expect(await fetcher.getVaults(1)).toStrictEqual(vaults0);
    expect(await fetcher.getVaults(2)).toStrictEqual(vaults1);
    expect(await fetcher.getVaults(3)).toStrictEqual(vaults2);

    // update block #1
    updateMock(mockCall, 1, vaults2);
    // using cache value
    expect(await fetcher.getVaults(1)).toStrictEqual(vaults0);
    
  });

});