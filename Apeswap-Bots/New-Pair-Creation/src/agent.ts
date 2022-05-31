import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { providers } from "ethers";
import NetworkManager from "./network";
import NetworkData from "./network";
import { createFinding, newPairParamsType, newPairFindingType, providerParams, apePairCreate2 } from "./utils";

const networkManager = new NetworkManager();

export const initialize = (provider: providers.Provider) => {
  return async () => {
    const { chainId } = await provider.getNetwork();
    networkManager.setNetwork(chainId);
  };
};

export const provideHandleTransaction = (
  providerParams: newPairParamsType,
  networkData: NetworkData,
  createPair: any
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const txLogs = txEvent.filterFunction(providerParams.functionAbi, networkData.apeFactoryAddress);

    txLogs.forEach((txLog) => {
      const { args } = txLog;
      const tokenA: string = args[0].toLowerCase();
      const tokenB: string = args[1].toLowerCase();

      const token0: string = tokenA < tokenB ? tokenA : tokenB;
      const token1: string = tokenA < tokenB ? tokenB : tokenA;
      const newPairContractAddress: string = createPair(token0, token1, networkData).toLowerCase();

      const newPairMetadata: newPairFindingType = {
        tokenAAddress: tokenA,
        tokenBAddress: tokenB,
        pairAddress: newPairContractAddress,
      };

      findings.push(createFinding(newPairMetadata));
    });
    return findings;
  };
};
export default {
  handleTransaction: provideHandleTransaction(providerParams, networkManager, apePairCreate2),
  initialize: initialize(getEthersProvider()),
};
