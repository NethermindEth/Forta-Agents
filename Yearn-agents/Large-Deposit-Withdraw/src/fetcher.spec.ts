import abi from './abi';
import Mock, { Methods } from './mock';
import VaultsFetcher from './fetcher';
import { createAddress } from 'forta-agent-tools';
import BigNumber from 'bignumber.js';


const provider: string = createAddress("0xdead");


describe("Valuts fetcher tests suite", () => {
  const mockWeb3: Mock = new Mock();
  const fetcher: VaultsFetcher = new VaultsFetcher(mockWeb3);

  beforeEach(() => mockWeb3.clear());

  it("should return expected vaults", async () => {
    const vaults: string[][] = [[
        createAddress("0x0"),
        createAddress("0x1"),
        createAddress("0x2"),
      ],[
        createAddress("0xcafe"),
      ],[
        createAddress("0xa0"),
        createAddress("0xa1"),
    ]];

    for(let i = 0; i < 3; ++i){
      mockWeb3
        .registerContract(abi.PROVIDER, provider)
        .registerCall(Methods.ASSETS, vaults[i], i);

      expect(await fetcher.getVaults(provider, i)).toStrictEqual(vaults[i]);
      // using cached value
      expect(await fetcher.getVaults(provider, i)).toStrictEqual(vaults[i]);
    }   
  });

  it("should return expected max withdraw limit", async () => {
    const testData: any[] = [{
        vault: createAddress("0x1"),
        block: 10,
        supply: 50,
        expected: new BigNumber(50),
      },{
        vault: createAddress("0xa2"),
        block: 5,
        supply: 1230,
        expected: new BigNumber(1230),
      },{
        vault: createAddress("0xcafe"),
        block: 42,
        supply: 1,
        expected: new BigNumber(1),
    }];

    for(let test of testData){
      mockWeb3
        .registerContract(abi.VAULT, test.vault)
        .registerCall(Methods.SUPPLY, test.supply, test.block);

      expect(await fetcher.getMaxWithdraw(test.vault, test.block)).toStrictEqual(test.expected);
      // using cached value
      expect(await fetcher.getMaxWithdraw(test.vault, test.block)).toStrictEqual(test.expected);
    }   
  });

  it("should return expected max deposit limit", async () => {
    const testData: any[] = [{
        vault: createAddress("0x1"),
        block: 10,
        deposit: 50,
        debt: 5,
        balance: 3, 
        expected: new BigNumber(42),
        token: createAddress("0xc1"),
      },{
        vault: createAddress("0xa2"),
        block: 5,
        deposit: 1230,
        debt: 200,
        balance: 1000,
        expected: new BigNumber(30),
        token: createAddress("0xc2"),
      },{
        vault: createAddress("0xcafe"),
        block: 42,
        deposit: 1,
        debt: 0,
        balance: 0,
        expected: new BigNumber(1),
        token: createAddress("0xc3"),
    }];

    for(let test of testData){
      mockWeb3
        .registerContract(abi.VAULT, test.vault)
        .registerContract(abi.TOKEN, test.token)
        .registerCall(Methods.DEPOSIT, test.deposit, test.block)
        .registerCall(Methods.TOKEN, test.token, test.block)
        .registerCall(Methods.DEBT, test.debt, test.block)
        .registerCall(Methods.BALANCE, test.balance, test.block, test.vault);

      expect(await fetcher.getMaxDeposit(test.vault, test.block)).toStrictEqual(test.expected);
      // using cached value
      expect(await fetcher.getMaxDeposit(test.vault, test.block)).toStrictEqual(test.expected);
    }   
  });

});