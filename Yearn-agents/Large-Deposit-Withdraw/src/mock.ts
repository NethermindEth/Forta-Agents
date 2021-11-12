import { when, resetAllWhenMocks } from "jest-when";

export default class Mock {
  public eth: any = {
    Contract: jest.fn(),
  };

  public methods: any = {
    assetsAddresses: jest.fn(),
    depositLimit: jest.fn(),
    token: jest.fn(),
    totalDebt: jest.fn(),
    balanceOf: jest.fn(),
    totalSupply: jest.fn(),
  }

  public clear(): void {
    resetAllWhenMocks();
  }

  public registerContract(...params: any[]): Mock {
    when(this.eth.Contract)
      .calledWith(...params)
      .mockReturnValueOnce(this);
    return this;
  }

  public registerCall(target: string, output: any,...params: any[]): Mock {
    when(this.methods[target])
      .calledWith(...params)
      .mockReturnValueOnce(output);
    return this
  }
};
