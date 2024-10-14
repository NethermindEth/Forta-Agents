import { ethers, Finding, Initialize, BlockEvent, HandleBlock, getEthersProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import CONFIG from "./agent.config";
import { AgentState, NetworkData } from "./utils";
import { createFinding } from "./finding";
import { RESERVES_ABI, TARGET_RESERVES_ABI } from "./constants";

const networkManager = new NetworkManager(CONFIG);
const state: AgentState = {
  cometContracts: {},
  alertedAt: {},
};

export const provideInitialize = (
  state: AgentState,
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  const iface = new ethers.utils.Interface([RESERVES_ABI, TARGET_RESERVES_ABI]);

  return async () => {
    await networkManager.init(provider);

    state.cometContracts = networkManager.get("cometAddresses").reduce((acc, comet) => {
      acc[comet] = new ethers.Contract(comet, iface, provider);
      return acc;
    }, {} as Record<string, ethers.Contract>);
  };
};

export const provideHandleBlock = (state: AgentState, networkManager: NetworkManager<NetworkData>): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const cometAddresses = networkManager.get("cometAddresses");
    const alertInterval = networkManager.get("alertInterval");

    const [reserves, targetReserves] = await Promise.all([
      Promise.all(
        cometAddresses.map((comet) =>
          state.cometContracts[comet].getReserves({
            blockTag: blockEvent.blockNumber,
          })
        )
      ),
      Promise.all(
        cometAddresses.map((comet) =>
          state.cometContracts[comet].targetReserves({
            blockTag: blockEvent.blockNumber,
          })
        )
      ),
    ]);

    targetReserves.forEach((targetRes, index) => {
      const comet = cometAddresses[index];

      if (!state.alertedAt[comet]) state.alertedAt[comet] = -1;

      const aboveOrAtTargetReserves = reserves[index].gte(targetRes);
      const pastAlertCooldown =
        state.alertedAt[comet] === -1 || blockEvent.block.timestamp >= alertInterval + state.alertedAt[comet];

      if (aboveOrAtTargetReserves && pastAlertCooldown) {
        state.alertedAt[comet] = blockEvent.block.timestamp;

        findings.push(createFinding(networkManager.getNetwork(), comet, reserves[index], targetRes));
      } else if (!aboveOrAtTargetReserves) {
        state.alertedAt[comet] = -1;
      }
    });

    return findings;
  };
};

export default {
  initialize: provideInitialize(state, networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(state, networkManager),
};
