import { Finding, HandleTransaction, TransactionEvent, LogDescription, getEthersProvider } from "forta-agent";

import { createFinding, EVENTS_SIGNATURES, AUGUSTUS_SWAPPER_CONTRACTS } from "./utils";

let augustusSwapperContract = "";

const initialize = async () => {
  // set the contract address based on the networkId.
  const provider = getEthersProvider();
  const network = await provider.getNetwork();
  augustusSwapperContract = AUGUSTUS_SWAPPER_CONTRACTS[network.chainId];
};

export const provideHandleTransaction =
  (contract: string): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    if (!contract) contract = augustusSwapperContract;

    const logs: LogDescription[] = txEvent.filterLog(EVENTS_SIGNATURES, contract);
    if (logs.length === 0) return findings;

    logs.forEach((log) => {
      findings.push(createFinding(log));
    });

    return findings;
  };

export default {
  initialize,
  handleTransaction: provideHandleTransaction(augustusSwapperContract),
};
