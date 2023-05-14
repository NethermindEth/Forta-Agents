import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from "forta-agent";
import CONFIG from "./agent.config";
import { BigNumber, providers } from "ethers";
import Fetcher from "./dataFetcher";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, abs } from "./utils";
import { createFinding } from "./finding";

const ALERTS: { [address: string]: number } = {};

const networkManager: NetworkManager<NetworkData> = new NetworkManager(CONFIG);
const dataFetcher: Fetcher = new Fetcher(getEthersProvider(), networkManager);

export const provideInitialize =
  (provider: providers.Provider | any) => async () => {
    const { chainId } = await provider.getNetwork();
    await networkManager.init(provider);
    networkManager.setNetwork(chainId);
    dataFetcher.setContracts();
  };

export const provideHandleBlock = (fetcher: Fetcher): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];
    let targetReservesPromises: Promise<BigNumber>[] = [];
    let reservesPromises: Promise<BigNumber>[] = [];
    let cometAddresses = fetcher.networkManager.get("cometAddresses");

    cometAddresses.map(async (comet: string) => {
      // Call getReserves() for each comet contract
      reservesPromises.push(fetcher.getReserves(comet, "latest"));
      // Call targetReserves() for each comet contract
      targetReservesPromises.push(fetcher.getTargetReserves(comet, "latest"));
    });

    let targetReserves = await Promise.all(targetReservesPromises);
    let reserves = await Promise.all(reservesPromises);

    targetReserves.forEach((targetRes, index) => {
      const comet = cometAddresses[index];
      if (!ALERTS[comet]) ALERTS[comet] = -1;

      // 0. if Reserves > 0 and Reserves >= targetReserves
      if (reserves[index].gte(0) && abs(reserves[index]).gte(targetRes)) {
        // If last alert exceeds the frequency, or no alert was emitted before, return finding
        if (
          ALERTS[comet] == -1 ||
          blockEvent.block.timestamp >
            fetcher.networkManager.get("alertFrequency") + ALERTS[comet]
        ) {
          // Update latest alert.
          ALERTS[comet] = blockEvent.block.timestamp;
          findings.push(
            createFinding(
              fetcher.networkManager.getNetwork().toString(),
              comet,
              reserves[index].toString(),
              targetRes.toString()
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
