import { Finding, HandleTransaction, TransactionEvent, LogDescription } from "forta-agent";
import utils from "./utils";
import { utils as ethers, providers } from "ethers";
import NetworkData from "./network";
import NetworkManager from "./network";

const networkManager = new NetworkManager();

export const initialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideHandleTransaction =
  (data: NetworkData): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const masterApeLogs: LogDescription[] = txEvent.filterLog(utils.EVENTS_ABI[0], data.masterApe);
    const masterApeAdminLogs: LogDescription[] = txEvent.filterLog(utils.EVENTS_ABI, data.masterApeAdmin);
    const masterApeFunctionCalls: ethers.TransactionDescription[] = txEvent.filterFunction(
      utils.FUNCTIONS_ABI,
      data.masterApe
    );

    masterApeLogs.forEach((log) => {
      findings.push(utils.createEventFinding(log, "MasterApe"));
    });

    masterApeAdminLogs.forEach((log) => {
      findings.push(utils.createEventFinding(log, "MasterApeAdmin"));
    });

    masterApeFunctionCalls.forEach((call) => {
      findings.push(utils.createFunctionFinding(call));
    });

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(networkManager),
};
