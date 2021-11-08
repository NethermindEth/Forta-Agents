import { createAddress } from 'forta-agent-tools';

const VAULTS: string[] = [createAddress('0x1')];

export const strategies = jest.fn();
export const isActive = jest.fn();
export const name = jest.fn();
export const keeper = jest.fn();

export type Args = boolean[];

const build_Mock = (args: Args) =>
  class MockContract {
    private addr: string;

    public methods = {
      name: this.NAME,
      withdrawalQueue: this.withdrawalQueue,
      assetsAddresses: this.assetsAddresses,
      isActive: this.isActive,
      keeper: this.keeper
    };

    constructor(_: any, addr: string) {
      this.addr = addr;

      strategies
        .mockReturnValueOnce(createAddress('0x2'))
        .mockReturnValueOnce(createAddress('0x3'))
        .mockReturnValueOnce(createAddress('0x4'))
        .mockReturnValueOnce(createAddress('0x5'))
        .mockReturnValueOnce(createAddress('0x'));
      
      name
        .mockReturnValueOnce('Maker')
        .mockReturnValueOnce('Maker')
        .mockReturnValueOnce('Curve')
        .mockReturnValueOnce('Uniswap');
      
      isActive.mockReturnValueOnce(args[0]).mockReturnValueOnce(args[1]);
        
      keeper
        .mockReturnValueOnce(createAddress('0xa'))
        .mockReturnValueOnce(createAddress('0xb'))
    }

    private NAME() {
      return {
        call: () => name(),
      };
    }

    private withdrawalQueue() {
      return {
        call: () => strategies(),
      };
    }

    private assetsAddresses() {
      return {
        call: () => VAULTS,
      };
    }

    private isActive() {
      return {
        call: () => isActive(),
      };
    }

    private keeper() {
      return {
        call: () => keeper()
      }
    }
  };

export default {
  build_Mock,
  strategies
};