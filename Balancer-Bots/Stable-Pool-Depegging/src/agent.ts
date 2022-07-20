import { ethers, Finding, getEthersProvider, Initialize, HandleTransaction, TransactionEvent } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import {
  createValueThresholdFinding,
  createDecreasePercentageThresholdFinding,
  createDecreaseThresholdFinding,
} from "./finding";
import { NetworkData, provideGetAmpUpdateStartedLogs, toBn, getPoolName } from "./utils";
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

export const provideHandleTransaction = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider,
  getPoolName: any
): HandleTransaction => {
  const getAmpUpdateStartedLogs = provideGetAmpUpdateStartedLogs(networkManager);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const logs = await getAmpUpdateStartedLogs(txEvent);

    const valueThreshold = networkManager.get("valueThreshold");
    const decreaseThreshold = networkManager.get("decreaseThreshold");
    const decreasePercentageThreshold = networkManager.get("decreasePercentageThreshold");

    const findings: Finding[] = [];

    await Promise.all(
      logs.map(async (log) => {
        const startValue: ethers.BigNumber = log.args.startValue;
        const endValue: ethers.BigNumber = log.args.endValue;

        if (valueThreshold !== undefined && endValue.lte(valueThreshold)) {
          const poolName = await getPoolName(log.emitter, provider);

          findings.push(createValueThresholdFinding(log.emitter, startValue, endValue, poolName));
        }

        if (decreaseThreshold !== undefined && startValue.sub(endValue).gte(decreaseThreshold)) {
          const poolName = await getPoolName(log.emitter, provider);

          findings.push(
            createDecreaseThresholdFinding(log.emitter, startValue, endValue, startValue.sub(endValue), poolName)
          );
        }

        if (decreasePercentageThreshold !== undefined) {
          const endValueBn = toBn(endValue);
          const startValueBn = toBn(startValue);

          const decreasePercentage = startValueBn.minus(endValueBn).div(startValueBn).shiftedBy(2);

          if (decreasePercentage.gte(decreasePercentageThreshold)) {
            const poolName = await getPoolName(log.emitter, provider);

            findings.push(
              createDecreasePercentageThresholdFinding(log.emitter, startValue, endValue, decreasePercentage, poolName)
            );
          }
        }
      })
    );

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager, getEthersProvider(), getPoolName),
};
