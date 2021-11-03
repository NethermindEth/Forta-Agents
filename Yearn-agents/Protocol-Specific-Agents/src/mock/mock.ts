import { createAddress } from 'forta-agent-tools';

const VAULTS: string[] = [createAddress('0x1')];

export type Args = [name: string];

export const STRATEGIES = jest.fn();
STRATEGIES.mockReturnValueOnce(createAddress('0x2'))
  .mockReturnValueOnce(createAddress('0x3'))
  .mockReturnValueOnce(createAddress('0x4'));

export const isActive = jest.fn();
isActive
  .mockReturnValueOnce(true)
  .mockReturnValueOnce(true)
  .mockReturnValueOnce(false);

export const name = jest.fn();
name
  .mockReturnValueOnce('Maker')
  .mockReturnValueOnce('Maker')
  .mockReturnValueOnce('Curve');

const build_Mock = () =>
  class MockContract {
    private addr: string;

    public methods = {
      name: this.NAME,
      withdrawalQueue: this.withdrawalQueue,
      assetsAddresses: this.assetsAddresses,
      ilk: this.ilk,
      isActive: this.isActive,
    };

    constructor(_: any, addr: string) {
      this.addr = addr;
    }

    private NAME() {
      return {
        call: () => name(),
      };
    }

    private ilk() {
      return {
        call: () =>
          '0x4554482d43000000000000000000000000000000000000000000000000000000',
      };
    }

    private withdrawalQueue() {
      return {
        call: () => STRATEGIES(),
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
  };

export default {
  build_Mock,
  VAULTS,
  STRATEGIES,
};
