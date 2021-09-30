import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import { provideFunctionCallsDetectorAgent } from "@nethermindeth/general-agents-module";
import TimeTracker from "./TimeTracker";

const address = "0x2417c2762ec12f2696f62cfa5492953b9467dc81";
const functionSignature = "poke()";

const functionCallDetector = provideFunctionCallsDetectorAgent(
  () => {
    return {} as Finding;
  },
  functionSignature,
  { to: address }
);

export const provideHandleTransaction = (): HandleTransaction => {
  const timeTracker = new TimeTracker();

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];
    const timestamp = txEvent.block.timestamp;

    if (timeTracker.isDifferentHour(timestamp)) {
      timeTracker.updateFindingReport(false);
      timeTracker.updateFunctionWasCalled(false);
    }

    if (
      (await functionCallDetector(txEvent)).length !== 0 &&
      timeTracker.isInFirstTenMins(timestamp)
    ) {
      timeTracker.updateFunctionWasCalled(true);
    }

    if (
      !timeTracker.isInFirstTenMins(timestamp) &&
      !timeTracker.functionWasCalled &&
      !timeTracker.findingReported
    ) {
      findings.push(
        Finding.fromObject({
          name: "Method not called within the first 10 minutes",
          description:
            "Poke() function not called within 10 minutes of the hour",
          alertId: "MakerDAO-OSM-4",
          severity: FindingSeverity.Critical,
          type: FindingType.Unknown,
        })
      );
    }

    timeTracker.updateHour(timestamp);
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(),
};
