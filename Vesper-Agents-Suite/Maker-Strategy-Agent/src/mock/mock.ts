import { createAddress } from 'forta-agent-tools';

const ZERO: string = createAddress('0x0');
const CONTROLLER: string = createAddress('0x1111');
const ADDRESS_LIST: string = createAddress('0x2222');

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

const build_Mock = (pools: string[]) => {
  class MockContract {
    private addr: string;

    public methods = {
      name: this.NAME,
      strategy: this.strategy,
      getStrategies: this.getStrategies,
      pools: this.pools,
      length: this.length,
      at: this.at,
      poolAccountant: this.poolAccountant.bind(this),
    };

    constructor(_: any, address: string) {
      this.addr = address;
    }

    private NAME() {
      return {
        call: () => 'test',
      };
    }

    private strategy(pool: string) {
      return {
        call: () => createAddress('0x1'),
      };
    }

    private getStrategies() {
      return {
        call: () => createAddress('0x2'),
      };
    }

    private pools() {
      return {
        call: () => createAddress('0x3'),
      };
    }

    private length() {
      return {
        call: () => '2',
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
