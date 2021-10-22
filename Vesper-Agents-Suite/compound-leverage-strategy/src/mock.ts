import { createAddress } from "forta-agent-tools";

export const createMockContractGenerator = (contractPerAddress: {
  [key: string]: any;
}) => {
  return class {
    public methods: any;

    constructor(_: any, contractAddress: string) {
      this.methods = contractPerAddress[contractAddress]?.methods;
    }
  }
};

export class mockPool {
  private strategies: string[];

  public methods = {
    getStrategies: this.getStrategies.bind(this),
  };

  constructor(strategies: string[]) {
    this.strategies = strategies;
  }

  private getStrategies() {
    return {
      call: () => {
        if (this.strategies === []) {
          throw new Error("V2 Pools doesn't have getStrategies method");
        }
        return this.strategies;
      }
    };
  }
}

export class mockStrategy {
  private name: string;
  private currentBorrowRatio: string = "";
  private rangeBorrowRatio: any;

  public methods = {
    NAME: this.NAME.bind(this),
    currentBorrowRatio: this.getCurrentBorrowRatio.bind(this),
    borrowRatioRange: this.getRangeBorrowRatio.bind(this),
  };

  constructor(name: string) {
    this.name = name;
  }

  private NAME() {
    return {
      call: () => this.name,
    };
  }

  private getCurrentBorrowRatio() {
    return {
      call: () => this.currentBorrowRatio,
    };
  }

  private getRangeBorrowRatio() {
    return {
      call: () => this.rangeBorrowRatio,
    };
  }

  public setCurrentBorrowRatio(newRatio: string) {
    this.currentBorrowRatio = newRatio;
  }

  public setRangeBorrowRatio(minBorrowRatio: string, maxBorrowRatio: string) {
    this.rangeBorrowRatio = {
      minBorrowRatio,
      maxBorrowRatio,
    };
  }
}

export class mockController {
  private poolsAddress: string;
  private strategies: { [key: string]: string };

  public methods = {
    pools: this.pools.bind(this),
    strategy: this.strategy.bind(this),
  };

  constructor(poolsAddress: string, strategies: { [key: string]: string }) {
    this.poolsAddress = poolsAddress;
    this.strategies = strategies;
  }

  private pools() {
    return {
      call: () => this.poolsAddress,
    };
  }

  private strategy(pool: string) {
    return {
      call: () => {
        let strategy = this.strategies[pool];
        if (strategy === undefined) {
          strategy = createAddress("0x0");
        }
        return strategy;
      }
    };
  }
}

export class mockAddressList {
  private pools: string[];

  public methods = {
    length: this.length.bind(this),
    at: this.at.bind(this),
  };

  constructor(pools: string[]) {
    this.pools = pools;
  }

  private length() {
    return {
      call: () => this.pools.length.toString(),
    };
  }

  private at(index: number) {
    return {
      call: () => this.pools[index],
    };
  }
}

export class mockComptroller {
  private markets: any = {};

  public methods = {
    markets: this.getMarketInfo.bind(this),
  };

  private getMarketInfo(cToken: string) {
    return {
      call: () => this.markets[cToken],
    };
  }

  public setMarketInfo(cToken: string, collateralFactorMantissa: string) {
    this.markets[cToken] = {
      collateralFactorMantissa,
    };
  }
}
