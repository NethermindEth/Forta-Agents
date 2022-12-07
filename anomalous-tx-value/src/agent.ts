import BigNumber from "bignumber.js";
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
  Initialize,
} from "forta-agent";
import { NetworkData } from "./utils";
import { providers } from "ethers";
import { NetworkManager } from "forta-agent-tools";
import CONFIG from "./agent.config";

const networkManager = new NetworkManager<NetworkData>(CONFIG);

const provideInitialize = (networkManager: NetworkManager<NetworkData>, provider: providers.Provider): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (networkManager: NetworkManager<NetworkData>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const value = new BigNumber(txEvent.transaction.value);

    if (value.isLessThanOrEqualTo(networkManager.get("threshold"))) return findings;

    findings.push(
      Finding.fromObject({
        name: "High Value Use Detection",
        description: "High value is used.",
        alertId: "NETHFORTA-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          value: value.toString(),
        },
      })
    );

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
