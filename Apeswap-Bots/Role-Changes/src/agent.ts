import { Finding, HandleTransaction, TransactionEvent, LogDescription } from "forta-agent";
import utils from "./utils";
import { utils as ethers } from "ethers";

export const provideHandleTransaction =
  (masterApeContract: string, masterApeAdminContract: string): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const masterApeLogs: LogDescription[] = txEvent.filterLog(utils.EVENTS_ABI[0], masterApeContract);
    const masterApeAdminLogs: LogDescription[] = txEvent.filterLog(utils.EVENTS_ABI, masterApeAdminContract);
    const masterApeFunctionCalls: ethers.TransactionDescription[] = txEvent.filterFunction(
      utils.FUNCTIONS_ABI,
      masterApeContract
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
  handleTransaction: provideHandleTransaction(utils.MASTER_APE, utils.MASTER_APE_ADMIN),
};
