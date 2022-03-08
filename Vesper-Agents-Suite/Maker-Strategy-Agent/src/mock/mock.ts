import { createAddress } from "forta-agent-tools";

const CM: string = createAddress("0x3333");
const CONTROLLER: string[] = [createAddress("0x6")];

const STRATEGIES_V2: string[] = [createAddress("0x3")];
const STRATEGIES_V3: string[] = [createAddress("0x5")];

export type Args = [
  isUnderWater: boolean,
  vaultInfo: { collateralRatio: string },
  lowWater: string,
  highWater: string,
  name: string,
  value: number,
];

const build_Mock = (args: Args) =>
  class MockContract {
    private addr: string;

    public methods = {
      NAME: this.NAME,
      strategy: this.strategy,
      getStrategies: this.getStrategies,
      cm: this.cm,
      getVaultInfo: this.getVaultInfo,
      isUnderwater: this.isUnderwater,
      lowWater: this.lowWater,
      highWater: this.highWater,
      length: this.length,
      at: this.at,
      poolAccountant: this.poolAccountant.bind(this),
      collateralType: this.collateralType,
      totalLocked: this.totalLocked,
      totalValue: this.totalValue,
      controller: this.controller
    };

    constructor(_: any, address: string) {
      this.addr = address;
    }

    private NAME() {
      return {
        call: () => args[4]
      };
    }

    private controller() {
      return {
        call: () => CONTROLLER
      };
    }

    private totalValue() {
      return {
        call: () => args[5]
      };
    }

    private totalLocked() {
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
        call: () => args[0]
      };
    }
    private getVaultInfo() {
      return {
        call: () => args[1]
      };
    }

    private lowWater() {
      return {
        call: () => args[2]
      };
    }

    private highWater() {
      return {
        call: () => args[3]
      };
    }

    private at(index: number) {
      return {
        call: () => args[index]
      };
    }

    private poolAccountant() {
      return {
        call: () => this.addr
      };
    }

    private collateralType() {
      return {
        call: () =>
          "0x4554482d43000000000000000000000000000000000000000000000000000000"
      };
    }
  };

export default {
  CONTROLLER,
  STRATEGIES_V2,
  STRATEGIES_V3,
  build_Mock
};
