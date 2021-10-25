import { createAddress } from "forta-agent-tools";

const CM: string = createAddress("0x3333");
const POOLS: string[] = [createAddress("0x2")];

const STRATEGIES_V2: string[] = [createAddress("0x3")];
const STRATEGIES_V3: string[] = [createAddress("0x5")];

export type Args = [
  pools: string[],
  isUnderWater: boolean,
  vaultInfo: { collateralRatio: string },
  lowWater: string,
  highWater: string,
  name: string
];

const build_Mock = (args: Args) =>
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
      poolAccountant: this.poolAccountant.bind(this)
    };

    constructor(_: any, address: string) {
      this.addr = address;
    }

    private NAME() {
      return {
        call: () => args[5]
      };
    }

    private strategy(pool: string) {
      return {
        call: () => STRATEGIES_V2
      };
    }

    private getStrategies() {
      return {
        call: () => STRATEGIES_V3
      };
    }

    private pools() {
      return {
        call: () => POOLS
      };
    }

    private cm() {
      return {
        call: () => CM
      };
    }

    private length() {
      return {
        call: () => "2"
      };
    }

    private isUnderwater() {
      return {
        call: () => args[1]
      };
    }
    private getVaultInfo() {
      return {
        call: () => args[2]
      };
    }

    private lowWater() {
      return {
        call: () => args[3]
      };
    }

    private highWater() {
      return {
        call: () => args[4]
      };
    }

    private at(index: number) {
      return {
        call: () => args[0][index]
      };
    }

    private poolAccountant() {
      return {
        call: () => this.addr
      };
    }
  };

export default {
  POOLS,
  STRATEGIES_V2,
  STRATEGIES_V3,
  build_Mock
};
