import { Finding, HandleTransaction, TransactionEvent, LogDescription } from "forta-agent";
import { createEventFinding, createFunctionFinding } from "./findings";
import { ADMIN_OPERATIONS, AUGUSTUS_SWAPPER_CONTRACT } from "./utils";

export const provideHandleTransaction =
  (augustusSwapperContract: string): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // get event logs
    const logs: LogDescription[] = txEvent.filterLog(
      [ADMIN_OPERATIONS[4], ADMIN_OPERATIONS[5]],
      augustusSwapperContract
    );
    // get function calls
    const functionsCalls = txEvent.filterFunction(
      [ADMIN_OPERATIONS[0], ADMIN_OPERATIONS[1], ADMIN_OPERATIONS[2], ADMIN_OPERATIONS[3]],
      augustusSwapperContract
    );
    // generate findings for logs.
    logs.forEach((log) => {
      findings.push(createEventFinding(log));
    });
    // generate findings for function calls
    functionsCalls.forEach((call) => {
      findings.push(createFunctionFinding(call));
    });

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(AUGUSTUS_SWAPPER_CONTRACT),
};
