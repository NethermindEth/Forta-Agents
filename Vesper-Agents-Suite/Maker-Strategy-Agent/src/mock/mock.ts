import { createAddress } from 'forta-agent-tools';

const ZERO: string = createAddress('0x0');
const CONTROLLER: string = createAddress('0x1111');
const ADDRESS_LIST: string = createAddress('0x2222');
const CM: string = createAddress('0x3333');

const POOLS: string[] = [
  createAddress('0x1'),
  createAddress('0x2'),
  createAddress('0x3'),
  createAddress('0x4'),
  createAddress('0x5'),
  createAddress('0x6'),
  createAddress('0x7'),
  createAddress('0x8'),
];

const STRATEGIES_V2: string[] = [
  createAddress('0x9'),
  createAddress('0x10'),
  createAddress('0x11'),
  createAddress('0x12'),
];
const STRATEGIES_V3: string[] = [
  createAddress('0x13'),
  createAddress('0x14'),
  createAddress('0x15'),
  createAddress('0x16'),
  createAddress('0x17'),
  createAddress('0x18'),
  createAddress('0x19'),
  createAddress('0x20'),
];
const STRATEGIES: string[] = [...STRATEGIES_V2, ...STRATEGIES_V3];

const build_Mock = (pools: string[]) =>
  class MockContract {
    private addr: string;

    public methods = {
      NAME: this.NAME,
      strategy: this.strategy,
      getStrategies: this.getStrategies,
      pools: this.pools,
      cm: this.cm,
      getVaultInfo: this.getVaultInfo,
      isUnderwater: this.isUnderwater,
      lowWater: this.lowWater,
      highWater: this.highWater,
      length: this.length,
      at: this.at,
      poolAccountant: this.poolAccountant.bind(this),
    };

    constructor(_: any, address: string) {
      this.addr = address;
    }

    private NAME() {
      return {
        call: () => 'Maker',
      };
    }

    private strategy(pool: string) {
      return {
        call: () => createAddress('0x1'),
      };
    }

    private getStrategies() {
      return {
        call: () => STRATEGIES,
      };
    }

    private pools() {
      return {
        call: () => POOLS,
      };
    }

    private cm() {
      return {
        call: () => CM,
      };
    }

    private length() {
      return {
        call: () => '2',
      };
    }

    private isUnderwater() {
      return {
        call: () => true,
      };
    }
    private getVaultInfo() {
      return {
        call: () => 250,
      };
    }

    private lowWater() {
      return {
        call: () => 200,
      };
    }

    private highWater() {
      return {
        call: () => 300,
      };
    }

    private at(index: number) {
      return {
        call: () => pools[index],
      };
    }

    private poolAccountant() {
      return {
        call: () => this.addr,
      };
    }
  };

export default {
  CONTROLLER,
  ADDRESS_LIST,
  POOLS,
  STRATEGIES_V2,
  STRATEGIES_V3,
  STRATEGIES,
  build_Mock,
};
