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
import { AgentState } from "./utils";

const networkManager = new NetworkManager(CONFIG);
const dataFetcher: Fetcher = new Fetcher(getEthersProvider(), networkManager);
const state: AgentState = {
  alerts: {},
};

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  await networkManager.init(provider);
  networkManager.setNetwork(chainId);

  dataFetcher.setContracts();
};

export const provideHandleBlock = (
  fetcher: Fetcher,
  state: AgentState
): HandleBlock => {
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
      if (!state.alerts[comet]) state.alerts[comet] = -1;

      // 0. if Reserves > 0 and Reserves >= targetReserves
      if (reserves[index].gte(0) && reserves[index].gte(targetRes)) {
        // If last alert exceeds the frequency, or no alert was emitted before, return finding
        if (
          state.alerts[comet] === -1 ||
          blockEvent.block.timestamp >
            fetcher.networkManager.get("alertFrequency") + state.alerts[comet]
        ) {
          // Update latest alert.
          state.alerts[comet] = blockEvent.block.timestamp;
          findings.push(
            createFinding(
              fetcher.networkManager.getNetwork(),
              comet,
              reserves[index],
              targetRes
            )
          );
        }
        //Update lastest alert
      } else state.alerts[comet] = -1;
    });
    return findings;
  };
};

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleBlock: provideHandleBlock(dataFetcher, state),
};
