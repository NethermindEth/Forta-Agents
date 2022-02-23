import axios from "axios";
import { providers, Contract } from "ethers";
import {
  workerInterface,
  positionManagerInterface,
  tokenInterface,
} from "./abi";
import { BigNumber, constants } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export type Fetcher = (url: string) => Promise<AddressesRegistry>;

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

const getPositionManager = async (
  workerAddress: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<string> => {
  const workerContract = new Contract(workerAddress, workerInterface, provider);
  try {
    return await workerContract.masterChef({ blockTag: blockNumber });
  } catch {}

  try {
    return await workerContract.wexMaster({ blockTag: blockNumber });
  } catch {}

  return await workerContract.bscPool({ blockTag: blockNumber });
};

const getWorkerData = async (
  workerAddress: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<[string, string]> => {
  const workerContract = new Contract(workerAddress, workerInterface, provider);
  return Promise.all([
    workerContract.pid({ blockTag: blockNumber }),
    workerContract.lpToken({ blockTag: blockNumber }),
  ]);
};

const getShareAmount = async (
  positionManagerAddress: string,
  workerAddress: string,
  pid: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<BigNumber> => {
  const positionManagerContract = new Contract(
    positionManagerAddress,
    positionManagerInterface,
    provider
  );
  return (
    await positionManagerContract.userInfo(pid, workerAddress, {
      blockTag: blockNumber,
    })
  ).amount;
};

const getTotalSupply = async (
  tokenAddress: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<BigNumber> => {
  const tokenContract = new Contract(tokenAddress, tokenInterface, provider);
  return tokenContract.totalSupply({ blockTag: blockNumber });
};

export const getSharePercent = async (
  workerAddress: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<BigNumber> => {
  const [pid, lpToken] = await getWorkerData(
    workerAddress,
    blockNumber,
    provider
  );

  if (lpToken === constants.AddressZero) {
    return BigNumber.from(0);
  }
  const positionManager = await getPositionManager(
    workerAddress,
    blockNumber,
    provider
  );
  const shareAmount = await getShareAmount(
    positionManager,
    workerAddress,
    pid,
    blockNumber,
    provider
  );
  const totalSupply = await getTotalSupply(lpToken, blockNumber, provider);
  return shareAmount.mul(100).div(totalSupply);
};

export const createFinding = (
  workerAddress: string,
  percent: string
): Finding => {
  return Finding.fromObject({
    name: "High Share of Liquidity Pool Alert",
    description: "An Alpaca worker owns more than 51% of pool shares",
    alertId: "ALPACA-5",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Alpaca Finance",
    metadata: {
      worker: workerAddress,
      workerPercentage: percent,
    },
  });
};
