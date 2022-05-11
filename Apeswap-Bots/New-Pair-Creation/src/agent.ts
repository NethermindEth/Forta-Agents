import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { providers } from "ethers";

import { APEFACTORY_ABI } from "./constants";
import NetworkManager from "./network";
import NetworkData from "./network";

import { createFinding, newPairParamsType, newPairFindingType, providerParams } from "./utils";
const { CREATE_PAIR_FUNCTION } = APEFACTORY_ABI;

const networkManager = new NetworkManager();

export const initialize = (provider: providers.Provider) => {
  return async () => {
    const { chainId } = await provider.getNetwork();
    networkManager.setNetwork(chainId);
  };
};

export const provideHandleTransaction = (
  { functionSig }: newPairParamsType,
  { apeFactoryAddress }: NetworkData
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const txLogs = txEvent.filterFunction(functionSig, apeFactoryAddress);

    txLogs.forEach((txLog) => {
      const { args } = txLog;

      const newPairMetadata: newPairFindingType = {
        tokenAAddress: args[0].toLowerCase(),
        tokenBAddress: args[1].toLowerCase(),
      };

      findings.push(createFinding(newPairMetadata, CREATE_PAIR_FUNCTION));
    });
    return findings;
  };
};
export default {
  handleTransaction: provideHandleTransaction(providerParams, networkManager),
  initialize: initialize(getEthersProvider()),
};
