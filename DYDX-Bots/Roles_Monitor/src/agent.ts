import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import NetworkData from "./network";
import NetworkManager, { NETWORK_MAP } from "./network";
import { EVENTS } from "./utils";
import { createFinding } from "./findings";

const networkManager = new NetworkManager(NETWORK_MAP);

export function provideHandleTransaction(networkManager: NetworkData): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // If any of the desired events are emitted by either
    // the Safety Module or Liquidity Module contracts,
    // create a finding
    txEvent.filterLog(EVENTS, [networkManager.safetyModule, networkManager.liquidityModule]).map((log) => {
      findings.push(createFinding(log.name, log.args, log.address));
    });

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(networkManager),
};
