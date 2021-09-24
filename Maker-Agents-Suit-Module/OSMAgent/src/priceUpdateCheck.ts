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
} from "general-agents-module";

const time = new TimeTracking();
const address = "0x2417c2762ec12f2696f62cfa5492953b9467dc81";
export const functionSignature = "function poke()";

const createFindingGenerator = (alertId: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    return Finding.fromObject({
      name: "Method not called within the first 10 minutes",
      description: "Poke() functioon not called within 10 minutes of the hour",
      alertId: "NETHFORTA-24",
      severity: FindingSeverity.Critical,
      type: FindingType.Unknown,
    });
  };
};

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  let findings: Finding[] = [];

  if (!txEvent.addresses[address]) return findings;

  const timestamp = txEvent.block.timestamp;

  const agentHandler = provideFunctionCallsDetectorAgent(
    createFindingGenerator("Nethforta-24"),
    functionSignature
  );

  const data = await agentHandler(txEvent);
  console.log(data);

  findings = [...findings, ...(await agentHandler(txEvent))];

  //  console.log(findings);
  time.initialUpdate(timestamp);

  // if time is less than 10 min when the tx is submitted.
  if (time.getTime(timestamp)) {
    time.setStatus(true);
    return findings;
  } else {
    // time > 10min
    if (!time.getStatus()) {
      findings.push(
        Finding.fromObject({
          name: "Method not called within the first 10 minutes",
          description:
            "Poke() functioon not called within 10 minutes of the hour",
          alertId: "NETHFORTA-24",
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
