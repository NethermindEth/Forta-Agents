import { BigNumber } from "ethers";
import { Finding, HandleTransaction, TransactionEvent, LogDescription, getEthersProvider } from "forta-agent";
import { createEventFinding, createFunctionFinding } from "./findings";
import { ADMIN_OPERATIONS, AUGUSTUS_SWAPPER_CONTRACTS } from "./utils";

let AugustusSwapperContract = "";

const initialize = async () => {
  // set the contract address based on the networkId.
  const provider = getEthersProvider();
  const network = await provider.getNetwork();
  AugustusSwapperContract = AUGUSTUS_SWAPPER_CONTRACTS[network.chainId];
};

export const provideHandleTransaction =
  (_AugustusSwapperContract: string): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    if (!_AugustusSwapperContract) _AugustusSwapperContract = AugustusSwapperContract;

    // get event logs
    const logs: LogDescription[] = txEvent.filterLog(
      [ADMIN_OPERATIONS[5], ADMIN_OPERATIONS[6]],
      _AugustusSwapperContract
    );
    // get function calls
    const functionsCalls = txEvent.filterFunction(
      [ADMIN_OPERATIONS[0], ADMIN_OPERATIONS[2], ADMIN_OPERATIONS[3], ADMIN_OPERATIONS[4]],
      _AugustusSwapperContract
    );
    // generate findings for logs.
    logs.forEach((log) => {
      findings.push(createEventFinding(log));
    });
    // get Transfer event logs.
    let transferLogs = txEvent.filterLog([ADMIN_OPERATIONS[1]], _AugustusSwapperContract);

    functionsCalls.forEach((call) => {
      // for transferTokens call, generate findings only if the Transfer event was emitted.
      if (call.name == "transferTokens") {
        for (let transfer of transferLogs) {
          if (
            transfer.args.from.toLowerCase() == txEvent.from.toLowerCase() &&
            transfer.args.to.toLowerCase() == call.args.destination.toLowerCase() &&
            BigNumber.from(transfer.args.value).eq(BigNumber.from(call.args.amount))
          ) {
            findings.push(createFunctionFinding(call));
            transferLogs.splice(transferLogs.indexOf(transfer), 1);
            break;
          }
        }
        // generate findings for the other function calls
      } else findings.push(createFunctionFinding(call));
    });

    return findings;
  };

export default {
  initialize,
  handleTransaction: provideHandleTransaction(AugustusSwapperContract),
};
