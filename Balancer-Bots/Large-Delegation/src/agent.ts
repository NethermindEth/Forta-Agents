import {
  ethers,
  Finding,
  getEthersProvider,
  Initialize,
  HandleBlock,
  BlockEvent,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import CONFIG from "./agent.config";
import { createFinding } from "./finding";
import { AgentConfig } from "./utils";

export const provideInitialize = (config: AgentConfig, provider: ethers.providers.Provider): Initialize => {
  return async () => {};
};

export const provideHandleBlock = (config: AgentConfig, provider: ethers.providers.Provider): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    return [];
  };
};

export const provideHandleTransaction = (
  config: AgentConfig,
  provider: ethers.providers.Provider
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    return [];
  };
};

export default {
  initialize: provideInitialize(CONFIG, getEthersProvider()),
  handleBlock: provideHandleBlock(CONFIG, getEthersProvider()),
  handleTransaction: provideHandleTransaction(CONFIG, getEthersProvider()),
};
