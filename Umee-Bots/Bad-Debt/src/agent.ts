import { BlockEvent, ethers, Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";

import CONFIG from "./agent.config";
import { EVENTS_ABI } from "./constants";

import { AgentConfig } from "./utils";

export const provideHandleTransaction = (
  config: AgentConfig,
  provider: ethers.providers.Provider
): HandleTransaction => {
  const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
    console.log("logsss");
    const findings: Finding[] = [];
    const eventsLog = txEvent.filterLog(EVENTS_ABI, config.lendingPoolAddress);
    console.log("logsss", eventsLog);

    /*
    await Promise.all(
      eventsLog.map(async (logs) => {
        const [collateral, , availableBorrowsETH] = await utils.getUserData({
          logs,
          lendingPoolAddress: config.lendingPoolAddress,
          provider,
          blockNumber: txEvent.blockNumber,
        });
        if (collateral.gt(availableBorrowsETH)) {
          findings.push(
            utils.createFinding({
              collateralAmount: ethers.utils.formatEther(collateral).toString(),
              borrowAmount: ethers.utils.formatEther(availableBorrowsETH).toString(),
            })
          );
        }
      })
    );*/
    return findings;
  };
  return handleTransaction;
};

export default {
  handleTransaction: provideHandleTransaction(CONFIG, getEthersProvider()),
};
