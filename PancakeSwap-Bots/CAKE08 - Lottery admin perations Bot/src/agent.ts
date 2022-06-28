import { HandleTransaction, TransactionEvent } from "forta-agent";

import newGeneratorBot from "./new.random.generator";
import newOperatorBot from "./new.operator.and.treasury.and.injector.address";
import functionCallBot from "./function.call.listener";

let findingsCount = 0;

function provideHandleTransaction(
  newGeneratorBot: any,
  newOperatorBot: any,
  functionCallBot: any
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    //limit findings to 5 to avoid a spammed alert feed
    if (findingsCount >= 5) return [];

    const findings = (
      await Promise.all([
        newGeneratorBot.handleTransaction(txEvent),
        newOperatorBot.handleTransaction(txEvent),
        functionCallBot.handleTransaction(txEvent),
      ])
    ).flat();

    findingsCount = findings.length;
    return findings;
  };
}

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(newGeneratorBot, newOperatorBot, functionCallBot),
};
