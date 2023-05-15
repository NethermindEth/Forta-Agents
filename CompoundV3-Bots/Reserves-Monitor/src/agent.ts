import {
  BlockEvent,
  Finding,
  HandleBlock,
  getEthersProvider,
} from "forta-agent";
import CONFIG from "./agent.config";
import { providers } from "ethers";
import Fetcher from "./dataFetcher";
import { NetworkManager } from "forta-agent-tools";
import { createFinding } from "./finding";

const ALERTS: { [address: string]: number } = {};

const networkManager = new NetworkManager(CONFIG);
const dataFetcher: Fetcher = new Fetcher(getEthersProvider(), networkManager);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  await networkManager.init(provider);
  networkManager.setNetwork(chainId);
  dataFetcher.setContracts();
};

export const provideHandleBlock = (fetcher: Fetcher): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const cometAddresses = fetcher.networkManager.get("cometAddresses");

    const [reserves, targetReserves] = await Promise.all([
      Promise.all(
        cometAddresses.map((comet) => fetcher.getReserves(comet, "latest"))
      ),
      Promise.all(
        cometAddresses.map((comet) =>
          fetcher.getTargetReserves(comet, "latest")
        )
      ),
    ]);

    targetReserves.forEach((targetRes, index) => {
      const comet = cometAddresses[index];
      if (!ALERTS[comet]) ALERTS[comet] = -1;

      // 0. if Reserves > 0 and Reserves >= targetReserves
      if (reserves[index].gte(0) && reserves[index].gte(targetRes)) {
        // If last alert exceeds the frequency, or no alert was emitted before, return finding
        if (
          ALERTS[comet] === -1 ||
          blockEvent.block.timestamp >
            fetcher.networkManager.get("alertFrequency") + ALERTS[comet]
        ) {
          // Update latest alert.
          ALERTS[comet] = blockEvent.block.timestamp;
          findings.push(
            createFinding(
              fetcher.networkManager.getNetwork().toString(),
              comet,
              reserves[index],
              targetRes
            )
          );
        }
        //Update lastest alert
      } else ALERTS[comet] = -1;
    });
    return findings;
  };
};

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleBlock: provideHandleBlock(dataFetcher),
};
