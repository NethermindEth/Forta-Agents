import { HandleTransaction, TransactionEvent } from "forta-agent";

import newGeneratorBot from "./new.random.generator";
import newOperatorBot from "./new.operator.and.treasury.and.injector.address";
import functionCallBot from "./function.call.listener";

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {

    const findings = (
      await Promise.all([
        newGeneratorBot.handleTransaction(txEvent),
        newOperatorBot.handleTransaction(txEvent),
        functionCallBot.handleTransaction(txEvent),
      ])
    ).flat();

    return findings;
  };

export default {
  handleTransaction
};
