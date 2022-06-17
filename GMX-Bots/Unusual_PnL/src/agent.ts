import { Finding, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";
import BigNumber from "bignumber.js";

BigNumber.set({ DECIMAL_PLACES: 18 });

import { CLOSE_POSITION_EVENT, createFinding, PRICE_PRECISION } from "./utils";

import NetworkManager, { NetworkData } from "./network";

const networkManager = new NetworkManager();

export const initialize = (provider: ethers.providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideBotHandler = (networkDetails: NetworkData): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for close position events
    const closePositionEvents = txEvent.filterLog(CLOSE_POSITION_EVENT, networkDetails.vault);

    closePositionEvents.forEach(({ args }) => {
      const realisedPnl = new BigNumber(args.realisedPnl.toString()).dividedBy(PRICE_PRECISION);
      const positionSize = new BigNumber(args.size.toString()).dividedBy(PRICE_PRECISION);

      if (realisedPnl.abs().gt(new BigNumber(networkDetails.unUsualLimit))) {
        const pnlToSize = realisedPnl.abs().dividedBy(positionSize).multipliedBy(100);
        if(pnlToSize.gt(networkDetails.highPnlToSize)) 
          findings.push(createFinding(positionSize, realisedPnl, args.key, networkDetails.vault));
      }
    });

    return findings;
  };
};

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideBotHandler(networkManager),
};
