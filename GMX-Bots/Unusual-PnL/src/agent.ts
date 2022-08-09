import { Finding, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";
import BigNumber from "bignumber.js";
import NetworkManager from "forta-agent-tools/lib/network.manager";
import { CLOSE_POSITION_EVENT, createFinding, PRICE_PRECISION } from "./utils";
import { DATA, NetworkData } from "./network";

BigNumber.set({ DECIMAL_PLACES: 18 });

const networkManager = new NetworkManager(DATA);

export const initialize = (provider: ethers.providers.Provider) => async () => {
  await networkManager.init(provider);
};

export const provideBotHandler = (networkDetails: NetworkManager<NetworkData>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for close position events
    const closePositionEvents = txEvent.filterLog(CLOSE_POSITION_EVENT, networkDetails.get("vault"));

    closePositionEvents.forEach(({ args }) => {
      const realisedPnl = new BigNumber(args.realisedPnl.toString()).dividedBy(PRICE_PRECISION);
      const positionSize = new BigNumber(args.size.toString()).dividedBy(PRICE_PRECISION);

      if (realisedPnl.abs().gt(new BigNumber(networkDetails.get("unUsualLimit")))) {
        const pnlToSize = realisedPnl.abs().dividedBy(positionSize).multipliedBy(100);
        if (pnlToSize.gt(networkDetails.get("highPnlToSize")))
          findings.push(createFinding(positionSize, realisedPnl, args.key, networkDetails.get("vault")));
      }
    });

    return findings;
  };
};

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideBotHandler(networkManager),
};
