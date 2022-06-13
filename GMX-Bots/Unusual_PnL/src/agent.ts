import { Finding, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";
import BigNumber from "bignumber.js";
BigNumber.set({ DECIMAL_PLACES: 18 });
import { CLOSE_POSITION_EVENT, UNUSUAL_LIMIT, createFinding, HIGH_PNLTOSIZE, PRICE_PRECISION } from "./utils";

import NetworkManager, { NetworkData } from "./network";

const networkManager = new NetworkManager();

export const initialize = (provider: ethers.providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideBotHandler = (
  unusual_limit: number,
  high_pnlToSize: number,
  vaultAddress: NetworkData
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for close position events
    const closePositionEvents = txEvent.filterLog(CLOSE_POSITION_EVENT, vaultAddress.vault);

    closePositionEvents.forEach(({ args }) => {
      const realisedPnl = new BigNumber(args.realisedPnl.toString()).dividedBy(PRICE_PRECISION);
      const positionSize = new BigNumber(args.size.toString()).dividedBy(PRICE_PRECISION);

      if (realisedPnl.abs().gt(new BigNumber(unusual_limit))) {
        const pnlToSize = realisedPnl.abs().dividedBy(positionSize).multipliedBy(100);
        pnlToSize.gt(high_pnlToSize) &&
          findings.push(createFinding(positionSize, realisedPnl, args.key, vaultAddress.vault));
      }
    });

    return findings;
  };
};

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideBotHandler(UNUSUAL_LIMIT, HIGH_PNLTOSIZE, networkManager),
};
