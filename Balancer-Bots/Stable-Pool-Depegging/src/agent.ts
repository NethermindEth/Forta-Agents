import {
  ethers,
  Finding,
  getEthersProvider,
  Initialize,
  HandleBlock,
  BlockEvent,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { AMP_UPDATE_STARTED_ABI } from "./constants";
import { createAbsoluteThresholdFinding, createPercentageThresholdFinding } from "./finding";
import { NetworkData, toBn } from "./utils";
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
  const stablePoolIface = new ethers.utils.Interface([AMP_UPDATE_STARTED_ABI]);
  const topics = [stablePoolIface.getEventTopic("AmpUpdateStarted")];

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const encodedLogs = await provider.getLogs({
      topics,
      fromBlock: blockEvent.blockNumber,
      toBlock: blockEvent.blockNumber,
    });

    if (!encodedLogs.length) return [];

    const stablePoolAddresses = networkManager.get("stablePoolAddresses");
    const absoluteThreshold = networkManager.get("absoluteThreshold");
    const percentageThreshold = networkManager.get("percentageThreshold");

    const logs = encodedLogs
      .filter((log) => stablePoolAddresses.includes(log.address.toLowerCase()))
      .map((log) => stablePoolIface.parseLog(log));

    const findings: Finding[] = [];

    logs.forEach((log, idx) => {
      const poolAddress = encodedLogs[idx].address;

      if (absoluteThreshold !== undefined && log.args.endValue.lte(absoluteThreshold)) {
        findings.push(createAbsoluteThresholdFinding(poolAddress, log.args.endValue));
      }

      if (percentageThreshold !== undefined) {
        const endValue = toBn(log.args.endValue);
        const startValue = toBn(log.args.startValue);

        const decreasePercentage = endValue.minus(startValue).div(endValue).shiftedBy(2);

        if (decreasePercentage.gte(percentageThreshold)) {
          findings.push(createPercentageThresholdFinding(poolAddress, log.args.endValue, decreasePercentage));
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
