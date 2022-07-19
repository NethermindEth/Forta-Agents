import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import CONFIG from "./agent.config";
import { POOL_REGISTERED_ABI } from "./constants";
import { createFinding } from "./finding";
import { AgentConfig } from "./utils";

export const provideHandleTransaction =
  (config: AgentConfig): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> =>
    txEvent.filterLog(POOL_REGISTERED_ABI, config.vaultAddress).map((log) => createFinding(log));

export default {
  handleTransaction: provideHandleTransaction(CONFIG),
};
