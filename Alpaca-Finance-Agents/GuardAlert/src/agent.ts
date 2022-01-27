import {
  BlockEvent,
  Finding,
  HandleBlock,
  getEthersProvider,
} from "forta-agent";
import {
  fetchAddresses,
  checkIsStable,
  getLpsWorker,
  PriceStatus,
  createFinding,
  Fetcher,
} from "./utils";
import { providers } from "ethers";

const DATA_URL =
  "https://raw.githubusercontent.com/alpaca-finance/bsc-alpaca-contract/main/.mainnet.json";

export const provideHandleBlock = (
  fetcher: Fetcher,
  url: string,
  provider: providers.Provider
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const addresses = await fetcher(url);

    const lpsAndWorkers = getLpsWorker(addresses.vaults);

    const priceStatusPromises = lpsAndWorkers.map((worker) =>
      checkIsStable(worker.address, addresses.workerConfig, provider)
    );
    const priceStatus = await Promise.all(priceStatusPromises);

    for (let i = 0; i < lpsAndWorkers.length; i++) {
      if (
        priceStatus[i] === PriceStatus.LOW ||
        priceStatus[i] === PriceStatus.HIGH
      ) {
        findings.push(createFinding(lpsAndWorkers[i].lpToken, priceStatus[i]));
      }
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(
    fetchAddresses,
    DATA_URL,
    getEthersProvider()
  ),
};
