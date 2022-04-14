import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import { provideFunctionCallsDetectorHandler } from "forta-agent-tools";
import TimeTracker from "./time.tracker";

export const MEGAPOKER_CONTRACT = "0x1cfd93a4864bec32c12c77594c2ec79deec16038";
const functionSignature = "poke()";

const functionCallDetector = provideFunctionCallsDetectorHandler(
  () => {
    return {} as Finding;
  },
  functionSignature,
  { to: MEGAPOKER_CONTRACT }
);

export const createFinding = (): Finding => {
  return Finding.fromObject({
    name: "Method not called within the first 10 minutes",
    description: "Poke() function not called within 10 minutes of the hour",
    alertId: "MakerDAO-OSM-4",
    severity: FindingSeverity.Critical,
    type: FindingType.Info,
    everestId: "0xbabb5eed78212ab2db6705e6dfd53e7e5eaca437",
    metadata: {
      MegaPokerContractMEGAPOKER_CONTRACT: MEGAPOKER_CONTRACT,
    },
  });
};

export default function providePriceUpdateCheckHandler(): HandleTransaction {
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
      !timeTracker.isFirstHour(timestamp) &&
      !timeTracker.functionWasCalled &&
      !timeTracker.findingReported
    ) {
      timeTracker.updateFindingReport(true);
      findings.push(createFinding());
    }

    timeTracker.updateHour(timestamp);
    return findings;
  };
}
