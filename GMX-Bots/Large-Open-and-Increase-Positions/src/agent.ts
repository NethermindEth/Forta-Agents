import { Finding, getEthersProvider, HandleTransaction, LogDescription, TransactionEvent } from "forta-agent";
import { providers } from "ethers";
import BigNumber from "bignumber.js";
import { createFinding } from "./utils";
import NetworkData, { NETWORK_MAP } from "./network";
import { INCREASE_POSITION_EVENT, UPDATE_POSITION_EVENT, PRICE_MULTIPLIER } from "./constants";
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

    // extract only increaseEventLogs
    const increaseEventLogs: LogDescription[] = eventLogs.filter((eventLogs) => eventLogs.name == "IncreasePosition");

    // extract only updateEventLogs
    const updateEventLogs: LogDescription[] = eventLogs.filter((eventLogs) => eventLogs.name == "UpdatePosition");

    increaseEventLogs.forEach((increaseEventLog, index) => {
      const updateEventLog = updateEventLogs[index];
      const { sizeDelta, key: increaseKey, account } = increaseEventLog.args;
      const { size, key: updateKey } = updateEventLog.args;

      const baseSizeDelta: BigNumber = new BigNumber(sizeDelta.toString()).dividedBy(
        new BigNumber(PRICE_MULTIPLIER.toString())
      );

      const positionSizeDifference = size.sub(sizeDelta);

      if (increaseKey === updateKey && baseSizeDelta.gt(new BigNumber(networkManager.threshold))) {
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
    });
    return findings;
  };
};

export default {
  handleTransaction: provideTransactionHandler(networkManager, UPDATE_POSITION_EVENT, INCREASE_POSITION_EVENT),
  initialize: initialize(getEthersProvider()),
};
