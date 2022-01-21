import { Interface } from "@ethersproject/abi";
import { toChecksumAddress } from 'ethereumjs-util';
import { when, resetAllWhenMocks } from "jest-when";

interface Params {
  inputs: any[],
  outputs: any[],
}

export default class MockProvider {
  public call: any;
  public getStorageAt: any;
  public readonly _isProvider: boolean;

  constructor() { 
    this._isProvider = true;
    this.call = jest.fn(); 
    this.getStorageAt = jest.fn(); 
  }

  public addCallTo(contract: string, block: number | string, iface: Interface, id: any, params: Params): MockProvider {
    when(this.call)
      .calledWith({
        data: iface.encodeFunctionData(id, params.inputs),
        to: toChecksumAddress(contract),
      }, block)
      .mockReturnValue(iface.encodeFunctionResult(id, params.outputs));
    return this;
  }

  public addStorage(contract: string, slot: number, block: number, result: string): MockProvider {
    when(this.getStorageAt)
      .calledWith(contract, slot, block)
      .mockReturnValue(result);
    return this;
  }

  public clear(): void {
    resetAllWhenMocks();
  }
};
