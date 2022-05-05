import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { BigNumber, providers } from "ethers";
import NetworkData from "./network";
import NetworkManager from "./network";
import { THRESHOLD, SCHED_BORROW_ALLOC_CHANGE_EVENT } from "./utils";
import { createFinding } from "./findings";

const networkManager = new NetworkManager();

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export function provideHandleTransaction(networkManager: NetworkData, threshold: BigNumber): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // If `newAllocation` is greater than `threshold`, create a finding
    txEvent.filterLog([SCHED_BORROW_ALLOC_CHANGE_EVENT], networkManager.liquidityModule).map((log) => {
      if (log.args.newAllocation.gt(threshold)) {
        findings.push(createFinding(log));
      }
    });

    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager, THRESHOLD),
};
