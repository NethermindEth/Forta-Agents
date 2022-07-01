import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { providers, BigNumber } from "ethers";
import { formatEther } from "@ethersproject/units";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";
import TotalSupplyFetcher from "./total.supply.fetcher";
import { createFinding, providerParams, providerParamsType, threshold } from "./utils";

const networkManager = new NetworkManager(NETWORK_MAP);
const totalSupplyFetcher: TotalSupplyFetcher = new TotalSupplyFetcher(getEthersProvider(), networkManager);

export const initialize = (provider: providers.Provider) => {
  return async () => {
    const { chainId } = await provider.getNetwork();
    networkManager.setNetwork(chainId);
    totalSupplyFetcher.setBananaContract();
  };
};

export const provideTransactionHandler = (
  functionAbi: providerParamsType,
  networkData: NetworkData,
  supplyFetcher: TotalSupplyFetcher,
  threshold: BigNumber
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const txLogs = txEvent.filterFunction(functionAbi, networkData.bananaAddress);
    const bananaTotalSupply: BigNumber = await supplyFetcher.getTotalSupply(txEvent.blockNumber - 1);

    txLogs.forEach((txLog: any) => {
      const { transaction } = txEvent;
      const { to, from } = transaction;
      const { args } = txLog;
      const [amount] = args;

      const mintAmount: BigNumber = BigNumber.from(amount);
      const botMetaData = {
        from: from.toString(),
        to: to?.toString(),
        value: formatEther(amount),
      };

      if (mintAmount.mul(threshold).gte(bananaTotalSupply)) {
        findings.push(createFinding(botMetaData));
      }
    });
    return findings;
  };
};

export default {
  handleTransaction: provideTransactionHandler(providerParams, networkManager, totalSupplyFetcher, threshold),
  initialize: initialize(getEthersProvider()),
};
