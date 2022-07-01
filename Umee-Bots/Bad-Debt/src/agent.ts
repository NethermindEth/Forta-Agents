import { ethers, Finding, getEthersProvider, HandleTransaction, LogDescription, TransactionEvent } from "forta-agent";

import CONFIG from "./agent.config";
import { EVENTS_ABI } from "./constants";

import utils, { AgentConfig } from "./utils";

export const provideHandleTransaction = (
  config: AgentConfig,
  provider: ethers.providers.Provider
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const eventsLog: LogDescription[] = txEvent.filterLog(EVENTS_ABI, config.lendingPoolAddress);
    await Promise.all(
      eventsLog.map(async (log) => {
        const { totalCollateralETH, availableBorrowsETH } = await utils.getUserData({
          log,
          lendingPoolAddress: config.lendingPoolAddress,
          provider,
          blockNumber: txEvent.blockNumber,
        });
        if (availableBorrowsETH.gt(totalCollateralETH)) {
          findings.push(
            utils.createFinding({
              collateralAmount: totalCollateralETH,
              borrowAmount: availableBorrowsETH,
            })
          );
        }
      })
    );
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(CONFIG, getEthersProvider()),
};
