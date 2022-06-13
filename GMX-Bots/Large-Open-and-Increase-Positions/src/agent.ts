import { Finding, getEthersProvider, HandleTransaction, LogDescription, TransactionEvent, ethers } from "forta-agent";
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
  thresholdConfig: NetworkData,
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

    increaseEventLogs.forEach((increaseEvent, index) => {
      const updateEvent = updateEventLogs[index];
      const { args: increaseArgs } = increaseEvent;
      const { args: updateArgs } = updateEvent;
      const { sizeDelta, key: increasePositionKey, account } = increaseArgs;
      const { size, key: updatePositionKey } = updateArgs;
      const baseSizeDelta: BigNumber = new BigNumber(sizeDelta.toString()).dividedBy(new BigNumber(PRICE_MULTIPLIER));
      const positionSizeDifference = ethers.BigNumber.from(size).sub(ethers.BigNumber.from(sizeDelta));

      if (baseSizeDelta.gt(new BigNumber(thresholdConfig.threshold))) {
        findings.push(
          createFinding(
            account,
            networkManager.vaultAddress,
            updatePositionKey,
            increasePositionKey,
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
  handleTransaction: provideTransactionHandler(
    networkManager,
    networkManager,
    UPDATE_POSITION_EVENT,
    INCREASE_POSITION_EVENT
  ),
  initialize: initialize(getEthersProvider()),
};
