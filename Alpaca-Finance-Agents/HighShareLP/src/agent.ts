import {
  BlockEvent,
  Finding,
  HandleBlock,
  getEthersProvider,
} from "forta-agent";
import {
  getSharePercent,
  fetchAddresses,
  Fetcher,
  createFinding,
} from "./utils";
import { providers } from "ethers";

const BLOCK_LAPSE = 100;
const PERCENT_THRESHOLD = 51;
const DATA_URL =
  "https://raw.githubusercontent.com/alpaca-finance/bsc-alpaca-contract/main/.mainnet.json";

export const provideHandleBlock = (
  addressesFetcher: Fetcher,
  percentThreshold: number,
  blockLapse: number,
  provider: providers.Provider
): HandleBlock => {
  let lastBlock = -blockLapse;

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    if (blockEvent.blockNumber - lastBlock < blockLapse) {
      return [];
    }

    lastBlock = blockEvent.blockNumber;

    const findings: Finding[] = [];

    const registryAddresses = await addressesFetcher(DATA_URL);
    const workerAddresses: string[] = [];

    for (let vault of registryAddresses.vaults) {
      for (let worker of vault.workers) {
        workerAddresses.push(worker.address);
      }
    }

    const percentPromises = workerAddresses.map((worker) =>
      getSharePercent(worker, blockEvent.blockNumber, provider)
    );
    const percents = await Promise.all(percentPromises);

    for (let i = 0; i < workerAddresses.length; i++) {
      if (percents[i].gt(percentThreshold)) {
        findings.push(
          createFinding(workerAddresses[i], percents[i].toString())
        );
      }
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(
    fetchAddresses,
    PERCENT_THRESHOLD,
    BLOCK_LAPSE,
    getEthersProvider()
  ),
};
