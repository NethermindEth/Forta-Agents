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
  hasLosses,
} from "./utils";
import { VesperFetcher } from 'vesper-forta-module';
import Web3 from "web3";
const web3: Web3 = new Web3(getJsonRpcUrl());
const vesperFetcher: VesperFetcher = new VesperFetcher(web3);
import { REPORT_LOSS_ABI, earningReportedSignature } from "./abi";

export const provideHandleTransaction = (web3: Web3): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const poolAccountant: string[] = await vesperFetcher.getPoolAccountants(
      txEvent.blockNumber
    )
    const reportLossHandlers: HandleTransaction[] = poolAccountant.map(
      (poolAccountant) =>
        provideFunctionCallsDetectorHandler(
          createFindingCallDetector,
          REPORT_LOSS_ABI,
          {
            to: poolAccountant,
            filterOnArguments: (args: { [key: string]: any }): boolean => {
              return args[1] > 0
            }
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
      const result = await reportLossHandler(txEvent)
      findings = findings.concat(result);
    }

    for (let reportEarningReportedEvent of reportEarningEventWithLoss) {
      findings = findings.concat(await reportEarningReportedEvent(txEvent));
    }

    let findingsWithMetadata: Finding[] = [];
    for (let finding of findings) {
      const metadataInfo = await vesperFetcher.getMetaData(finding.metadata.strategyAddress, txEvent.blockNumber)
      const description = finding.description + metadataInfo + ", lossValue = " + finding.metadata.lossValue;
      const findingWithMetadata = { ...finding, description: description }
      findingsWithMetadata = findingsWithMetadata.concat(Finding.fromObject(findingWithMetadata));
    }
    return findingsWithMetadata;
  };
};

export default {
  handleTransaction: provideHandleTransaction(web3),
};
