import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";
import Web3 from "web3";
import { vaultAbi, getYearnVaults } from "./utils";
import { CacheContainer } from "node-ts-cache";
import { MemoryStorage } from "node-ts-cache-storage-memory";

const web3 = new Web3(getJsonRpcUrl());

export const createFinding = (
  pps: string,
  tracker: string,
  reason: string,
  id: number
) => {
  return Finding.fromObject({
    name: "Yearn PPS Agent",
    description: `Year PPS value: ${reason}`,
    alertId: `Yearn-8-${id}`,
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      pps,
      tracker,
    },
  });
};

interface CacheObject {
  [key: string]: BigNumber;
}

const provideHandleFunction = (web3: Web3): HandleBlock => {
  const threshold = 0.1;
  const cache = new CacheContainer(new MemoryStorage());

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const blockNumber = blockEvent.blockNumber;

    const vaults = await getYearnVaults(web3, blockNumber);

    let promises: BigNumber[] = [];

    for (let i of vaults) {
      const vault = new web3.eth.Contract(vaultAbi as any, i);

      promises.push(vault.methods.getPricePerFullShare().call({}, blockNumber));
    }

    promises = await Promise.all(promises);

    const storage: CacheObject = {};

    promises.map((value, index) => {
      storage[vaults[index]] = value;
    });

    await cache.setItem(blockNumber.toString(), storage, { ttl: 40 });

    let previous = await cache.getItem<CacheObject>(
      (blockNumber - 1).toString()
    );

    if (!previous) {
      return findings;
    }

    promises.forEach((pps, index) => {
      const vaultAddress = vaults[index];

      // @ts-ignore
      const vaultPrevValue = previous[vaultAddress as any];
      pps = new BigNumber(pps);

      // pps should increase only
      if (pps.isLessThan(vaultPrevValue)) {
        findings.push(
          createFinding(
            pps.toString(),
            vaultPrevValue.toString(),
            "Decrease in PPS",
            1
          )
        );
      }

      // swift change in pps
      if (
        Math.abs(
          pps.minus(vaultPrevValue).dividedBy(vaultPrevValue).toNumber()
        ) > threshold
      ) {
        findings.push(
          createFinding(
            pps.toString(),
            vaultPrevValue.toString(),
            "Very Swift change",
            2
          )
        );
      }
    });

    return findings;
  };
};

export default {
  handleBlock: provideHandleFunction(web3),
  provideHandleFunction,
};
