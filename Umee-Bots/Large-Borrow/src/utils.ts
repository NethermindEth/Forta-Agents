import { Mutex } from "async-mutex";
import BigNumber from "bignumber.js";
import { CallOverrides } from "ethers";
import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";
import LRU from "lru-cache";

export interface AgentConfig {
  lendingPoolAddress: string;
  tvlPercentageThreshold: string;
}

export function createFinding(
  amount: ethers.BigNumber,
  tvlPercentage: BigNumber,
  user: string,
  onBehalfOf: string
): Finding {
  return Finding.from({
    alertId: "UMEE-6",
    name: "Large borrow",
    description: "There was a large borrow based on the pool's TVL",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    protocol: "Umee",
    metadata: {
      amount: amount.toString(),
      tvlPercentage: tvlPercentage.toString(10),
      user: user.toLowerCase(),
      onBehalfOf: onBehalfOf.toLowerCase(),
    },
  });
}

export interface SmartCallerOptions {
  cacheByBlockTag: boolean;
}

export class SmartCaller {
  static cache = new LRU<string, Promise<any>>({ max: 200 });
  static mutex = new Mutex();

  [key: string]: ((...args: any[]) => Promise<any>) | any;
  contract: ethers.Contract;
  options: SmartCallerOptions;

  constructor(contract: ethers.Contract, options: Partial<SmartCallerOptions> = {}) {
    this.contract = contract;
    this.options = {
      cacheByBlockTag: true,
      ...options,
    };

    this.generateMethods();
  }

  static from(contract: ethers.Contract, options: Partial<SmartCallerOptions> = {}): SmartCaller {
    return new SmartCaller(contract, options);
  }

  protected generateMethods() {
    Object.keys(this.contract.functions).forEach((functionName) => {
      const inputsLength = this.contract.interface.getFunction(functionName).inputs.length;

      this[functionName] = (...args: any[]): Promise<any> => {
        let overrides = {};
        if (args.length === inputsLength + 1 && typeof args[args.length - 1] === "object") {
          Object.assign(overrides, args.pop());
        }

        return SmartCaller.smartCall(this.contract, functionName, args, overrides, this.options);
      };
    });
  }

  protected static async smartCall(
    contract: ethers.Contract,
    functionName: string,
    args: any[],
    overrides: CallOverrides,
    options: SmartCallerOptions
  ): Promise<any> {
    if (options.cacheByBlockTag && overrides.blockTag === "latest") {
      throw new Error("Caching for 'latest' block is not supported");
    }

    const key = JSON.stringify(
      options.cacheByBlockTag
        ? [contract.address, functionName, overrides.blockTag, args]
        : [contract.address, functionName, args]
    );

    let promise;

    const release = await this.mutex.acquire();
    try {
      if (this.cache.has(key)) {
        promise = this.cache.get(key);
      } else {
        promise = contract[functionName](...args, overrides);
        this.cache.set(key, promise);
      }
    } finally {
      release();
    }

    return await promise;
  }

  static clearCache() {
    this.cache.clear();
  }
}
