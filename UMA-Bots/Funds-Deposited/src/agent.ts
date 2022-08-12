import { Finding, HandleTransaction, TransactionEvent, ethers, Initialize, getEthersProvider } from "forta-agent";

import { FUNDS_DEPOSITED_EVENT } from "./ABI";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, DATA } from "./config";
import { createFinding } from "./findings";

const networkManager = new NetworkManager(DATA);

async function getToken(address: string) {
  let funcAbi = ["function name() external view returns(string)"];

  let token = new ethers.Contract(address, funcAbi, getEthersProvider());

  try {
    return await token.name();
  } catch (e) {
    console.error(e);
  }
}

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (networkManager: NetworkManager<NetworkData>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const spokePoolAddress = networkManager.get("spokePoolAddress");

    const findings: Finding[] = [];
    // filter the transaction logs for funds deposited events
    const fundsDepositedEvents = txEvent.filterLog(FUNDS_DEPOSITED_EVENT, spokePoolAddress);

    for (const fundsDepositedEvent of fundsDepositedEvents) {
      let { amount, originChainId, destinationChainId, originToken } = fundsDepositedEvent.args;

      let token = "Test Token";

      if (networkManager.getNetwork() === 1) {
        token = await getToken(originToken);
      }

      let metadata = {
        amount: amount.toString(),
        originChainId: originChainId.toString(),
        destinationChainId: destinationChainId.toString(),
        token,
      };

      findings.push(createFinding(metadata));
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
  provideHandleTransaction,
};
