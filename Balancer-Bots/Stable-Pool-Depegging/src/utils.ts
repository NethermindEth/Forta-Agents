import { ethers, TransactionEvent } from "forta-agent";
import BigNumber from "bignumber.js";
import { NetworkManager } from "forta-agent-tools";
import { AMP_UPDATE_STARTED_ABI, POOL_NAME_ABI } from "./constants";
import { Mutex } from "async-mutex";
import LRU from "lru-cache";

export interface NetworkData {
  stablePoolAddresses: string[];
  valueThreshold?: string;
  decreaseThreshold?: string;
  decreasePercentageThreshold?: string;
}

export const toBn = (ethersBn: ethers.BigNumber) => new BigNumber(ethersBn.toString());

export type GetAmpUpdateStartedLog = (
  txEvent: TransactionEvent
) => Promise<(ethers.utils.LogDescription & { emitter: string })[]>;

export function provideGetAmpUpdateStartedLogs(networkManager: NetworkManager<NetworkData>): GetAmpUpdateStartedLog {
  return async (txEvent: TransactionEvent) => {
    const encodedLogs = txEvent.filterLog([AMP_UPDATE_STARTED_ABI], networkManager.get("stablePoolAddresses"));

    return encodedLogs.map((log) => ({ ...log, emitter: log.address }));
  };
}

export interface SmartCallerOptions {
  cacheByBlockTag: boolean;
}

export class SmartCaller {
  static cache = new LRU<string, Promise<any>>({ max: 500 });
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
    overrides: ethers.CallOverrides,
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

export const getPoolName = async (poolAddress: string, provider: ethers.providers.Provider): Promise<string> => {
  const stablePool = SmartCaller.from(
    new ethers.Contract(poolAddress, new ethers.utils.Interface([POOL_NAME_ABI]), provider)
  );

  const poolName = await stablePool.name();

  return poolName;
};

export type AgentConfig = Record<number, NetworkData>;
