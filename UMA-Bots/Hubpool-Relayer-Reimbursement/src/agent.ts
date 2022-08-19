import { ethers, Finding, getEthersProvider, HandleTransaction, Initialize, TransactionEvent } from "forta-agent";
import { REIMBURSEMENT_EVENT, ADAPTER_TO_CHAIN_NAME } from "./constants";
import { createBotFinding } from "./helpers";
import { NetworkManager } from "forta-agent-tools";
import { NM_DATA, NetworkDataInterface } from "./network";

const networkManagerCurr = new NetworkManager(NM_DATA);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkDataInterface>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export function provideHandleTransaction(
  reimbursementEvent: string,
  adapterToChainName: {},
  networkManager: NetworkManager<NetworkDataInterface>
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const reimbursementEventTxns = txEvent.filterLog(reimbursementEvent, networkManager.get("hubPoolAddr"));
    reimbursementEventTxns.forEach((singleReimbursementEvent) => {
      const { l1Token, l2Token, amount, to } = singleReimbursementEvent.args;

      findings.push(
        createBotFinding(
          l1Token.toString(),
          l2Token.toString(),
          amount.toString(),
          to.toString(),
          adapterToChainName[to as keyof typeof adapterToChainName]
        )
      );
    });
    return findings;
  };
}

export default {
  initialize: provideInitialize(networkManagerCurr, getEthersProvider()),
  handleTransaction: provideHandleTransaction(REIMBURSEMENT_EVENT, ADAPTER_TO_CHAIN_NAME, networkManagerCurr),
};
