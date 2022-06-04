import {
  ethers,
  Finding,
  getEthersProvider,
  HandleTransaction,
  LogDescription,
  TransactionEvent,
} from "forta-agent";

import CONFIG from "./agent.config";
import { EVENTS_ABI } from "./constants";

import utils, { AgentConfig } from "./utils";

export const provideHandleTransaction = (
  config: AgentConfig,
  provider: ethers.providers.Provider
): HandleTransaction => {
  const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const eventsLog: LogDescription[] = txEvent.filterLog(EVENTS_ABI, config.lendingPoolAddress);   
    await Promise.all(
      eventsLog.map(async (logs) => {
        const [collateral, , availableBorrowsETH] = await utils.getUserData({
          logs,
          lendingPoolAddress: config.lendingPoolAddress,
          provider,
          blockNumber: txEvent.blockNumber,
        });
        if (availableBorrowsETH.gt(collateral)) {
          findings.push(
            utils.createFinding({
              collateralAmount: ethers.utils.formatEther(collateral).toString(),
              borrowAmount: ethers.utils.formatEther(availableBorrowsETH).toString(),
            })
          );
        }
      })
    );
    return findings;
  };
  return handleTransaction;
};

export default {
  handleTransaction: provideHandleTransaction(CONFIG, getEthersProvider()),
};
