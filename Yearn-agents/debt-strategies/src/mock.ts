import { createAddress } from 'forta-agent-tools';

const VAULTS: string[] = [createAddress('0x1')];

export const strategies = jest.fn();
export const isActive = jest.fn();
export const name = jest.fn();
export const keeper = jest.fn();
export const currentMakerVaultRatio = jest.fn();
export const collateralizationRatio = jest.fn();
export const rebalanceTolerance = jest.fn();

export type Args = boolean[];

const build_Mock = () =>
  class MockContract {
    private addr: string;

    public methods = {
      name: this.NAME,
      withdrawalQueue: this.withdrawalQueue,
      assetsAddresses: this.assetsAddresses,
      isActive: this.isActive,
      keeper: this.keeper,
      getCurrentMakerVaultRatio: this.getCurrentMakerVaultRatio,
      collateralizationRatio: this.collateralizationRatio,
      rebalanceTolerance: this.rebalanceTolerance
    };

    constructor(_: any, addr: string) {
      this.addr = addr;
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

    private getCurrentMakerVaultRatio() {
      return {
        call: () => currentMakerVaultRatio()
      }
    }

    private collateralizationRatio() {
      return {
        call: () => collateralizationRatio()
      }
    }

    private rebalanceTolerance() {
      return {
        call: () => rebalanceTolerance()
      }
    }
  };

const createReturnValuesMockFunction = (args: Args) => {
  jest.resetAllMocks();

  strategies
  .mockReturnValueOnce(MAKER_STRATEGY_ADDRESS_1)
  .mockReturnValueOnce(MAKER_STRATEGY_ADDRESS_2)
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
    .mockReturnValueOnce(KEEPER_ADDRESS_1)
    .mockReturnValueOnce(KEEPER_ADDRESS_2);
}

export const MAKER_STRATEGY_ADDRESS_1 = createAddress('0x2')
export const MAKER_STRATEGY_ADDRESS_2 = createAddress('0x3')
export const KEEPER_ADDRESS_1 = createAddress('0xa')
export const KEEPER_ADDRESS_2 = createAddress('0xb')

export default {
  build_Mock,
  createReturnValuesMockFunction
};