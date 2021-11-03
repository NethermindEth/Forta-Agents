import { createAddress } from 'forta-agent-tools';

const VAULTS: string[] = [createAddress('0x1'), createAddress('0x2')];

const STRATEGIES: string[] = [createAddress('0x3'), createAddress('0x4')];

export type Args = [vaults: string[], name: string];

const build_Mock = (args: Args) =>
  class MockContract {
    public methods = {
      name: this.NAME,
      getStrategies: this.getStrategies,
      vaults: this.vaults,
      collateralType: this.collateralType,
    };

    constructor() {}

    private NAME() {
      return {
        call: () => args[1],
      };
    }

    private getStrategies() {
      return {
        call: () => STRATEGIES,
      };
    }

    private vaults() {
      return {
        call: () => VAULTS,
      };
    }

    private collateralType() {
      return {
        call: () =>
          '0x4554482d43000000000000000000000000000000000000000000000000000000',
      };
    }
  };

export default {
  build_Mock,
  VAULTS,
  STRATEGIES,
};
