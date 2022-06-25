import { ethers, Finding, getEthersProvider, Initialize, HandleBlock, BlockEvent } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { createAbsoluteThresholdFinding, createPercentageThresholdFinding } from "./finding";
import { NetworkData, provideGetAmpUpdateStartedLogs, toBn } from "./utils";
import CONFIG from "./agent.config";
import BigNumber from "bignumber.js";

BigNumber.set({ DECIMAL_PLACES: 18 });

const networkManager = new NetworkManager(CONFIG);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleBlock = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): HandleBlock => {
  const getAmpUpdateStartedLogs = provideGetAmpUpdateStartedLogs(networkManager, provider);

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const logs = await getAmpUpdateStartedLogs(blockEvent.blockNumber);

    const absoluteThreshold = networkManager.get("absoluteThreshold");
    const percentageThreshold = networkManager.get("percentageThreshold");

    const findings: Finding[] = [];

    logs.forEach((log) => {
      if (absoluteThreshold !== undefined && log.args.endValue.lte(absoluteThreshold)) {
        findings.push(createAbsoluteThresholdFinding(log.emitter, log.args.endValue));
      }

      if (percentageThreshold !== undefined) {
        const endValue = toBn(log.args.endValue);
        const startValue = toBn(log.args.startValue);

        const decreasePercentage = endValue.minus(startValue).div(endValue).shiftedBy(2);

        if (decreasePercentage.gte(percentageThreshold)) {
          findings.push(createPercentageThresholdFinding(log.emitter, log.args.endValue, decreasePercentage));
        }
      }
    });

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, getEthersProvider()),
};
