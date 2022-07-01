import { Finding, HandleTransaction, TransactionEvent, LogDescription, getEthersProvider } from "forta-agent";
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

    //BSC
    const masterApeLogs: LogDescription[] = txEvent.filterLog(utils.EVENTS_ABI[0], data.masterApe);
    const masterApeAdminLogs: LogDescription[] = txEvent.filterLog(utils.EVENTS_ABI, data.masterApeAdmin);
    const masterApeFunctionCalls: ethers.TransactionDescription[] = txEvent.filterFunction(
      utils.FUNCTIONS_ABI,
      data.masterApe
    );

    //Polygon
    const miniApeV2Logs: LogDescription[] = txEvent.filterLog(utils.EVENTS_ABI[0], data.miniApeV2);
    const miniComplexRewarderTimeLogs: LogDescription[] = txEvent.filterLog(
      utils.EVENTS_ABI[0],
      data.miniComplexRewarderTime
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

    miniApeV2Logs.forEach((log) => {
      findings.push(utils.createEventFinding(log, "MiniApeV2"));
    });

    miniComplexRewarderTimeLogs.forEach((log) => {
      findings.push(utils.createEventFinding(log, "MiniComplexRewarderTime"));
    });

    return findings;
  };

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
