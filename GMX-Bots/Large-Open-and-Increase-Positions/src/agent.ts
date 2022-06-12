import { Finding, getEthersProvider, HandleTransaction, LogDescription, TransactionEvent, ethers } from "forta-agent";
import { providers } from "ethers";
import BigNumber from "bignumber.js";
import { createFinding } from "./utils";
import NetworkData, { NETWORK_MAP } from "./network";
import { VAULT_CONSTANTS } from "./constants";
import NetworkManager from "./network";

const { INCREASE_POSITION_EVENT, UPDATE_POSITION_EVENT, THRESHOLD, PRICE_MULTIPLIER } = VAULT_CONSTANTS;
const networkManager = new NetworkManager(NETWORK_MAP);

export const initialize = (provider: providers.Provider) => {
  return async () => {
    const { chainId } = await provider.getNetwork();
    networkManager.setNetwork(chainId);
  };
};

export const provideTransactionHandler = (
  networkManager: NetworkData,
  threshold: number,
  updatePositionEvent: string,
  increasePositionEvent: string
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const eventLogs: LogDescription[] = txEvent.filterLog(
      [updatePositionEvent, increasePositionEvent],
      networkManager.vaultAddress
    );

    // extract only increaseEventLogs
    const increaseEventLogs: LogDescription[] = eventLogs.filter((eventLogs) => eventLogs.name == "IncreasePosition"); 

    // extract only increaseEventLogs
    const updateEventLogs: LogDescription[] = eventLogs.filter((eventLogs) => eventLogs.name == "UpdatePosition");

    increaseEventLogs.forEach((increaseEvent, index) => {
      const updateEvent = updateEventLogs[index];
      const { args: increaseArgs } = increaseEvent; 
      const { args: updateArgs } = updateEvent;
      const { sizeDelta, key: increasePositionKey, account } = increaseArgs;
      const { size, key: updatePositionKey } = updateArgs;
      const baseSizeDelta: BigNumber = new BigNumber(sizeDelta.toString()).dividedBy(new BigNumber(PRICE_MULTIPLIER));
      const positionSizeDifference = ethers.BigNumber.from(size).sub(ethers.BigNumber.from(sizeDelta)); 

      if (baseSizeDelta.gt(new BigNumber(threshold))) {
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
    THRESHOLD,
    UPDATE_POSITION_EVENT,
    INCREASE_POSITION_EVENT
  ),
  initialize: initialize(getEthersProvider()),
};
