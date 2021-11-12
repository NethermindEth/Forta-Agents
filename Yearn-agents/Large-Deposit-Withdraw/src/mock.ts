import { when, resetAllWhenMocks } from "jest-when";

export enum Methods {
  ASSETS = 0,
  DEPOSIT = 1,
  TOKEN = 2,
  DEBT = 3,
  BALANCE = 4,
  SUPPLY = 5,
};

const getMethodName = (method: Methods): string => {
  switch(method){
    case(Methods.ASSETS):  return "assetsAddresses";
    case(Methods.DEPOSIT): return "depositLimit";
    case(Methods.TOKEN):   return "token";
    case(Methods.DEBT):    return "totalDebt";
    case(Methods.BALANCE): return "balanceOf";
    case(Methods.SUPPLY):  return "totalSupply";
    default: return "";
  }
};

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

  public registerContract(abi: any, contract: string): Mock {
    when(this.eth.Contract)
      .calledWith(abi, contract)
      .mockReturnValue(this)
    return this;
  }

  public registerCall(target: Methods, output: any, block: number, ...params: any[]): Mock {
    const optionsMock = jest.fn();
    when(optionsMock)
      .calledWith(expect.anything(), block)
      .mockReturnValueOnce(output);
    when(this.methods[getMethodName(target)])
      .calledWith(...params)
      .mockReturnValueOnce({ call: optionsMock });
    return this;
  }
};
