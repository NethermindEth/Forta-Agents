import BigNumber from "bignumber.js";
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

import TimeTracking from "./TimeTracking";
import {
  provideFunctionCallsDetectorAgent,
  FindingGenerator,
} from "@nethermindeth/general-agents-module";

const time = new TimeTracking();
const address = "0x2417c2762ec12f2696f62cfa5492953b9467dc81";
export const functionSignature = "poke()";

const createFindingGenerator = (alertId: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    return Finding.fromObject({
      name: "Method not called within the first 10 minutes",
      description: "Poke() function not called within 10 minutes of the hour",
      alertId: "MakerDAO-OSM-4",
      severity: FindingSeverity.Critical,
      type: FindingType.Unknown,
    });
  };
};

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  let findings: Finding[] = [];

  const agentHandler = provideFunctionCallsDetectorAgent(
    createFindingGenerator("MakerDAO-OSM-4"),
    functionSignature,
    { to: address }
  );

  const timestamp = txEvent.block.timestamp;

  findings.push(...findings, ...time.isNewHour(timestamp));

  if (!txEvent.addresses[address]) return findings;

  // if time is less than 10 min when the tx is submitted.
  if (time.isInFirstTenMins(timestamp)) {
    time.setFunctionCalledStatus(true);
    return [];
  } else {
    // time > 10min and if function is already called do nothing, else raise a warning
    if (!time.getFunctionCalledStatus()) {
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
  }

  return findings;
};

export default {
  handleTransaction,
};
