import { Finding, getEthersProvider, HandleTransaction, LogDescription, TransactionEvent } from "forta-agent";
import { providers } from "ethers";
import BigNumber from "bignumber.js";
import { createFinding } from "./utils";
import NetworkData, { NETWORK_MAP } from "./network";
import { INCREASE_POSITION_EVENT, UPDATE_POSITION_EVENT, PRICE_PRECISION } from "./constants";
import NetworkManager from "./network";

const networkManager = new NetworkManager(NETWORK_MAP);

export const initialize = (provider: providers.Provider) => {
  return async () => {
    const { chainId } = await provider.getNetwork();
    networkManager.setNetwork(chainId);
  };
};

export const provideTransactionHandler = (
  networkManager: NetworkData,
  updatePositionEvent: string,
  increasePositionEvent: string
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter transaction logs for increase and update position events
    const eventLogs: LogDescription[] = txEvent.filterLog(
      [increasePositionEvent, updatePositionEvent],
      networkManager.vaultAddress
    );

    eventLogs.forEach((eventLog, index) => {
      if (eventLog.name === "IncreasePosition") {
        const increaseEventLog = eventLogs[index];
        const updateEventLog = eventLogs[index + 1];

        const { key: increaseKey, sizeDelta, account } = increaseEventLog.args;
        const { key: updateKey, size } = updateEventLog.args;

        // compare increasePosition and updatePosition keys
        if (increaseKey === updateKey) {
          const positionSizeDifference = size.sub(sizeDelta);
          const baseSizeDelta: BigNumber = new BigNumber(sizeDelta.toString()).dividedBy(
            new BigNumber(PRICE_PRECISION.toString())
          );

          if (baseSizeDelta.gt(new BigNumber(networkManager.threshold))) {
            findings.push(
              createFinding(
                account,
                networkManager.vaultAddress,
                updateKey,
                increaseKey,
                size,
                sizeDelta,
                positionSizeDifference
              )
            );
          }
        }
      }
    });

    return findings;
  };
};

export default {
  handleTransaction: provideTransactionHandler(networkManager, UPDATE_POSITION_EVENT, INCREASE_POSITION_EVENT),
  initialize: initialize(getEthersProvider()),
};
