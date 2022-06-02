import {
  BlockEvent,
  ethers,
  Finding,
  getEthersProvider,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";

import CONFIG from "./agent.config";

import utils, { AgentConfig } from "./utils";

export const provideHandleTransaction = (
  config: AgentConfig,
  provider: ethers.providers.Provider
): HandleTransaction => {
  const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    return findings;
  };
  return handleTransaction;
};

export default {
  handleTransaction: provideHandleTransaction(CONFIG, getEthersProvider()),
};
