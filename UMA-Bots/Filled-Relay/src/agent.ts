import { Finding, HandleTransaction, TransactionEvent, ethers, Initialize, getEthersProvider } from "forta-agent";
import { FUNC_ABI, FILLED_RELAY_EVENT } from "./ABI";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, DATA } from "./config";
import { createFinding } from "./findings";
import BN from "bignumber.js";
import { getThreshold, getTokenInfo } from "./utils";

const networkManager = new NetworkManager(DATA);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    //get the correct contract address for the network selected
    const spokePoolAddress = networkManager.get("spokePoolAddress");

    const findings: Finding[] = [];
    // filter the transaction logs for funds deposited events
    const filledRelayEvents = txEvent.filterLog(FILLED_RELAY_EVENT, spokePoolAddress);

    for (const filledRelayEvent of filledRelayEvents) {
      let { amount, totalFilledAmount, originChainId, destinationChainId, originToken, depositor, relayer, recipient } =
        filledRelayEvent.args;

      let tokenInfo: { tokenName: string; tokenDecimals: number };

      tokenInfo = await getTokenInfo(originToken, provider, txEvent.blockNumber);

      let normalizedAmount = BN(totalFilledAmount.toString()).shiftedBy(-tokenInfo.tokenDecimals);

      if (getThreshold(tokenInfo.tokenName)) {
        if (normalizedAmount.gte(getThreshold(tokenInfo.tokenName))) {
          findings.push(); //push high finding
        }
      } else {
        findings.push(); //push info finding
      }
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager, getEthersProvider()),
  provideHandleTransaction,
};
