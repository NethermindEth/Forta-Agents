import {
  BlockEvent,
  Finding,
  HandleBlock,
  Initialize,
  getEthersProvider,
} from "forta-agent";
import { providers } from "ethers";
import { NetworkManager } from "forta-agent-tools";
import Fetcher from "./dataFetcher";
import CONFIG from "./agent.config";
import { AgentState, NetworkData } from "./utils";
import { createFinding } from "./finding";

const networkManager = new NetworkManager(CONFIG);
const dataFetcher: Fetcher = new Fetcher();
const state: AgentState = { alertedAt: {} };

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);

    dataFetcher.loadContracts(networkManager, provider);
  };
};

export const provideHandleBlock = (
  networkManager: NetworkManager<NetworkData>,
  fetcher: Fetcher,
  state: AgentState
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const cometAddresses = networkManager.get("cometAddresses");
    const alertInterval = networkManager.get("alertInterval");

    const [reserves, targetReserves] = await Promise.all([
      Promise.all(
        cometAddresses.map((comet) =>
          fetcher.getReserves(comet, blockEvent.blockNumber)
        )
      ),
      Promise.all(
        cometAddresses.map((comet) =>
          fetcher.getTargetReserves(comet, blockEvent.blockNumber)
        )
      ),
    ]);

    targetReserves.forEach((targetRes, index) => {
      const comet = cometAddresses[index];

      if (!state.alertedAt[comet]) state.alertedAt[comet] = -1;

      const aboveTargetReserves = reserves[index].gte(targetRes);
      const pastAlertCooldown =
        state.alertedAt[comet] === -1 ||
        blockEvent.block.timestamp > alertInterval + state.alertedAt[comet];

      if (aboveTargetReserves && pastAlertCooldown) {
        state.alertedAt[comet] = blockEvent.block.timestamp;
        findings.push(
          createFinding(
            networkManager.getNetwork(),
            comet,
            reserves[index],
            targetRes
          )
        );
      } else if (!aboveTargetReserves) {
        state.alertedAt[comet] = -1;
      }
    });

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, dataFetcher, state),
};
