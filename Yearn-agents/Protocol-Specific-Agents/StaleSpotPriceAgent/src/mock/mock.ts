import { createAddress } from 'forta-agent-tools';

const VAULTS: string[] = [createAddress('0x1')];

export const strategies = jest.fn();
export const isActive = jest.fn();
export const name = jest.fn();
export const ilk = jest.fn();

export type Args = boolean[];

const build_Mock = (args: Args) =>
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

      strategies
        .mockReturnValueOnce(createAddress('0x2'))
        .mockReturnValueOnce(createAddress('0x3'))
        .mockReturnValueOnce(createAddress('0x4'))
        .mockReturnValueOnce(createAddress('0x5'))
        .mockReturnValueOnce(createAddress('0x'));

      isActive.mockReturnValueOnce(args[0]).mockReturnValueOnce(args[1]);
      name
        .mockReturnValueOnce('Maker')
        .mockReturnValueOnce('Maker')
        .mockReturnValueOnce('Curve')
        .mockReturnValueOnce('Uniswap');

      ilk
        .mockReturnValueOnce(
          '0x4554482d43000000000000000000000000000000000000000000000000000000'
        )
        .mockReturnValueOnce(
          '0x5946492d41000000000000000000000000000000000000000000000000000000'
        );
    }

    private NAME() {
      return {
        call: () => name(),
      };
    }

    private ilk() {
      return {
        call: () => ilk(),
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
  };

export default {
  build_Mock,
  VAULTS,
  strategies,
  isActive,
  name,
};
