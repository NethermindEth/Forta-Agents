import { Finding, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";
import BigNumber from "bignumber.js";

import {
  DECREASE_POSITION_EVENT,
  CLOSE_POSITION_EVENT,
  PRICE_PRECISION,
  isPositionClosed,
  createFinding,
} from "./utils";

import NetworkManager, { NetworkData } from "./network";

const networkManager = new NetworkManager();

export const initialize = (provider: ethers.providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideBotHandler = (networkDetails: NetworkData): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for decrease position events
    const decreasePositionEvents = txEvent.filterLog(DECREASE_POSITION_EVENT, networkDetails.vault);

    // filter the transaction logs for close position events
    const closePositionEvents = txEvent.filterLog(CLOSE_POSITION_EVENT, networkDetails.vault);

    decreasePositionEvents.forEach(({ args }) => {
      const sizeDelta = new BigNumber(args.sizeDelta.toString()).dividedBy(new BigNumber(PRICE_PRECISION));
      if (sizeDelta.gt(new BigNumber(networkDetails.largeLimit))) {
        const isClosed: boolean = isPositionClosed(closePositionEvents, args);
        findings.push(createFinding(sizeDelta, args.key, args.account, isClosed, networkDetails.vault));
      }
    });

    return findings;
  };
};

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideBotHandler(networkManager),
};
