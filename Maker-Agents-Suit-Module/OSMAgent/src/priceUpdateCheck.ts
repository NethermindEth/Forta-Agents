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

export const finding = Finding.fromObject({
  name: "Method not called within the first 10 minutes",
  description: "Poke() function not called within 10 minutes of the hour",
  alertId: "MakerDAO-OSM-4",
  severity: FindingSeverity.Critical,
  type: FindingType.Unknown,
});

const createFindingGenerator = (alertId: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    return finding;
  };
};

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  let findings: Finding[] = [];

  const timestamp = txEvent.block.timestamp;

  const newHour = time.isNewHour(timestamp);

  if (newHour) {
    time.hour = time.getHour(timestamp);
    // when the  previous hour never got called
    if (time.hourStatus === false) {
      findings.push(finding as any);
    } else {
      time.hourStatus = false;
    }
  }

  if (findings.length !== 0) return findings;

  const agentHandler = provideFunctionCallsDetectorAgent(
    createFindingGenerator("MakerDAO-OSM-4"),
    functionSignature,
    { to: address }
  );

  if ((await agentHandler(txEvent)) === [] && !txEvent.addresses[address])
    return findings;

  // if time is less than 10 min when the tx is submitted.
  if (time.isInFirstTenMins(timestamp)) {
    time.setFunctionCalledStatus(true);
    return [];
  } else {
    // time > 10min and if function is already called do nothing, else raise a warning
    if (!time.getFunctionCalledStatus()) {
      findings.push(finding);
    }
  }

  return findings;
};

export default {
  handleTransaction,
};
