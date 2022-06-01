import { Finding, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";
import BigNumber from "bignumber.js";

import {
  DECREASE_POSITION_EVENT,
  CLOSE_POSITION_EVENT,
  PRICE_PRECISION,
  LARGE_LIMIT,
  isPositionClosed,
  createFinding,
} from "./utils";

import NetworkManager, { NetworkData } from "./network";

const networkManager = new NetworkManager();

export const initialize = (provider: ethers.providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideBotHandler = (large_limit: number, vaultAddress: NetworkData): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for decrease position events
    const decreasePositionEvents = txEvent.filterLog(DECREASE_POSITION_EVENT, vaultAddress.vault);

    // filter the transaction logs for close position events
    const closePositionEvents = txEvent.filterLog(CLOSE_POSITION_EVENT, vaultAddress.vault);

    decreasePositionEvents.forEach(({ args }) => {
      const sizeDelta = new BigNumber(args.sizeDelta.toString()).dividedBy(new BigNumber(PRICE_PRECISION));

      if (sizeDelta.gt(new BigNumber(large_limit))) {
        const isClosed: boolean = isPositionClosed(closePositionEvents, args);
        findings.push(createFinding(sizeDelta, args.key, args.account, isClosed, vaultAddress.vault));
      }
    });

    return findings;
  };
};

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideBotHandler(LARGE_LIMIT, networkManager),
};
