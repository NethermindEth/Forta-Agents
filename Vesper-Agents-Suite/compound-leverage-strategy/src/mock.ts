
export const createMockContractGenerator = (contractPerAddress: { [key: string]: string }) => {
  return (_: any, address: string) => {
    return contractPerAddress[address];
  }
};

export class mockPool {
  private strategies: string[];

  public methods = {
    getStrategies: this.getStrategies.bind(this),
  }

  constructor(strategies: string[]) {
    this.strategies = strategies;
  }

  private getStrategies() {
    return {
      call: () => this.strategies
    }
  }
};

export class mockStrategy {
  private name: string;

  public methods = {
    NAME: this.NAME.bind(this)
  }

  constructor(name: string) {
    this.name = name;
  }

  private NAME() {
    return {
      call: () => this.name
    }
  }
};

export class mockController {
  private poolsAddress: string;
  private strategies: { [key: string ]: string };

  public methods = {
    pools: this.pools.bind(this),
    strategy: this.strategy.bind(this),
  }

  constructor(poolsAddress: string, strategies: { [key: string]: string }) {
    this.poolsAddress = poolsAddress;
    this.strategies = strategies;
  }

  private pools() {
    return {
      call: () => this.poolsAddress
    }
  }

  private strategy(pool: string) {
    return {
      call: () => this.strategies[pool]
    }
  }
};

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
      call: () => this.pools.length.toString()
    }
  }

  private at(index: number) {
    return {
      call: () => this.pools[index]
    }
  }
};
