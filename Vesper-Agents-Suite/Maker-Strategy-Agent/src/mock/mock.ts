import { createAddress } from 'forta-agent-tools';

const CM: string = createAddress('0x3333');
const POOLS: string[] = [createAddress('0x2')];

const STRATEGIES_V2: string[] = [createAddress('0x3')];
const STRATEGIES_V3: string[] = [createAddress('0x4')];

const build_Mock = (
  pools: string[],
  isUnderWater: boolean = false,
  vaultInfo: { collateralRatio: string },
  lowWater: string,
  highWater: string,
  name: string = 'Maker'
) =>
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
        call: () => name,
      };
    }

    private strategy(pool: string) {
      return {
        call: () => STRATEGIES_V2,
      };
    }

    private getStrategies() {
      return {
        call: () => STRATEGIES_V3,
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
        call: () => isUnderWater,
      };
    }
    private getVaultInfo() {
      return {
        call: () => vaultInfo,
      };
    }

    private lowWater() {
      return {
        call: () => lowWater,
      };
    }

    private highWater() {
      return {
        call: () => highWater,
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
  POOLS,
  STRATEGIES_V2,
  STRATEGIES_V3,
  build_Mock,
};
