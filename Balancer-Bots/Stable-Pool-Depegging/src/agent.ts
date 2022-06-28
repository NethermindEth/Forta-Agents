import { ethers, Finding, getEthersProvider, Initialize, HandleBlock, BlockEvent } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import {
  createValueThresholdFinding,
  createDecreasePercentageThresholdFinding,
  createDecreaseThresholdFinding,
} from "./finding";
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

    const valueThreshold = networkManager.get("valueThreshold");
    const decreaseThreshold = networkManager.get("decreaseThreshold");
    const decreasePercentageThreshold = networkManager.get("decreasePercentageThreshold");

    const findings: Finding[] = [];

    logs.forEach((log) => {
      const startValue: ethers.BigNumber = log.args.startValue;
      const endValue: ethers.BigNumber = log.args.endValue;

      if (valueThreshold !== undefined && endValue.lte(valueThreshold)) {
        findings.push(createValueThresholdFinding(log.emitter, startValue, endValue));
      }

      if (decreaseThreshold !== undefined && startValue.sub(endValue).gte(decreaseThreshold)) {
        findings.push(createDecreaseThresholdFinding(log.emitter, startValue, endValue, startValue.sub(endValue)));
      }

      if (decreasePercentageThreshold !== undefined) {
        const endValueBn = toBn(endValue);
        const startValueBn = toBn(startValue);

        const decreasePercentage = startValueBn.minus(endValueBn).div(startValueBn).shiftedBy(2);

        if (decreasePercentage.gte(decreasePercentageThreshold)) {
          findings.push(
            createDecreasePercentageThresholdFinding(log.emitter, startValue, endValue, decreasePercentage)
          );
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
