import axios from "axios";
import { workerConfigInterface } from "./abi";
import { Contract, providers } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export type Fetcher = (url: string) => Promise<AddressesRegistry>;

export enum PriceStatus {
  OK,
  LOW,
  HIGH,
  UNKNOWN,
}

export type Worker = {
  address: string;
  lpToken: string;
};

export type Vault = {
  address: string;
  workers: Worker[];
};

export type AddressesRegistry = {
  workerConfig: string;
  vaults: Vault[];
};

export const fetchAddresses: Fetcher = async (url) => {
  const data = (await axios.get(url)).data;

  const addressesRegistry: AddressesRegistry = {
    workerConfig: data.SharedConfig.WorkerConfig,
    vaults: [],
  };

  for (let vault of data.Vaults) {
    const newVault: Vault = {
      address: vault.address,
      workers: [],
    };

    for (let worker of vault.workers) {
      const newWorker: Worker = {
        address: worker.address,
        lpToken: worker.stakingToken,
      };
      newVault.workers.push(newWorker);
    }

    addressesRegistry.vaults.push(newVault);
  }

  return addressesRegistry;
};

export const checkIsStable = async (
  worker: string,
  workerConfigAddress: string,
  provider: providers.Provider
): Promise<PriceStatus> => {
  const workerConfig = new Contract(
    workerConfigAddress,
    workerConfigInterface,
    provider
  );

  try {
    await workerConfig.isStable(worker);
    return PriceStatus.OK;
  } catch (e: any) {
    switch (e.reason) {
      case "WorkerConfig::isStable:: price too high":
        return PriceStatus.HIGH;

      case "WorkerConfig::isStable:: price too low":
        return PriceStatus.LOW;

      default:
        return PriceStatus.UNKNOWN;
    }
  }
};

export const getLpsWorker = (vaults: Vault[]): Worker[] => {
  const workers: Worker[] = [];
  const lps = new Set<string>();

  for (let vault of vaults) {
    for (let worker of vault.workers) {
      if (lps.has(worker.lpToken)) {
        continue;
      }
      lps.add(worker.lpToken);
      workers.push(worker);
    }
  }

  return workers;
};

export const createFinding = (
  lpToken: string,
  priceDeviation: PriceStatus
): Finding => {
  return Finding.fromObject({
    name: "Alpaca Guard",
    description: "DEX LP price has deviated too much from Oracle price",
    alertId: "ALPACA-2",
    protocol: "Alpaca Finance",
    severity: FindingSeverity.High,
    type: FindingType.Info,
    metadata: {
      lpToken: lpToken,
      priceDeviationDirection:
        priceDeviation === PriceStatus.HIGH ? "High" : "Low",
    },
  });
};
