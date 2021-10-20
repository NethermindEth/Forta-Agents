import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getJsonRpcUrl,
} from "forta-agent";
import {
  provideFunctionCallsDetectorHandler,
  provideEventCheckerHandler,
} from "forta-agent-tools";
import {
  createFindingCallDetector,
  createFindingEventDetector,
  getPoolAccountants,
  hasLosses,
} from "./utils";
import Web3 from "web3";
import { reportLossABI, earningReportedSignature } from "./abi";

const web3: Web3 = new Web3(getJsonRpcUrl());

export const provideHandleTransaction = (web3: Web3): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const poolAccountant: string[] = await getPoolAccountants(
      web3,
      txEvent.blockNumber
    );
    const reportLossHandlers: HandleTransaction[] = poolAccountant.map(
      (poolAccountant) =>
        provideFunctionCallsDetectorHandler(
          createFindingCallDetector,
          reportLossABI,
          {
            to: poolAccountant,
          }
        )
    );

    const reportEarningEventWithLoss: HandleTransaction[] = poolAccountant.map(
      (poolAccountant) =>
        provideEventCheckerHandler(
          createFindingEventDetector,
          earningReportedSignature,
          poolAccountant,
          hasLosses
        )
    );

    let findings: Finding[] = [];

    for (let reportLossHandler of reportLossHandlers) {
      findings = findings.concat(await reportLossHandler(txEvent));
    }

    for (let reportEarningReportdEvent of reportEarningEventWithLoss) {
      findings = findings.concat(await reportEarningReportdEvent(txEvent));
    }

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(web3),
};
