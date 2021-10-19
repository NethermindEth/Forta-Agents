import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";
import { provideFunctionCallsDetectorHandler } from "forta-agent-tools";
import {
  createFinding,
  reportLossSignature,
  getPoolAccountants,
} from "./utils";
import Web3 from "web3";

const web3: Web3 = new Web3(getJsonRpcUrl());

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const poolAccountant: string[] = await getPoolAccountants();
  const reportLossHandlers: HandleTransaction[] = poolAccountant.map(
    (poolAccountant) =>
      provideFunctionCallsDetectorHandler(createFinding, reportLossSignature, {
        to: poolAccountant,
      })
  );

  let findings: Finding[] = [];

  for (let reportLossHandler of reportLossHandlers) {
    findings = findings.concat(await reportLossHandler(txEvent));
  }

  return findings;
};

export default {
  handleTransaction,
};
