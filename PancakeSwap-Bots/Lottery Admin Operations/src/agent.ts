import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

import newGeneratorBot from "./new.random.generator";
import newOperatorBot from "./new.operator.and.treasury.and.injector.address";
import functionCallBot from "./function.call.listener";
import { PANCAKE_SWAP_LOTTERY_ADDRESS } from "./bot.config";

function providerHandleTransaction(contractAddress: string): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let newGeneratorBotHandleTransaction = newGeneratorBot.providerHandleTransaction(contractAddress);
    let newOperatorBotHandleTransaction = newOperatorBot.providerHandleTransaction(contractAddress);
    let functionCallBotHandleTransaction = functionCallBot.providerHandleTransaction(contractAddress);

    const findings = (
      await Promise.all([
        newGeneratorBotHandleTransaction(txEvent),
        newOperatorBotHandleTransaction(txEvent),
        functionCallBotHandleTransaction(txEvent),
      ])
    ).flat();

    return findings;
  };
}
export default {
  providerHandleTransaction,
  handleTransaction: providerHandleTransaction(PANCAKE_SWAP_LOTTERY_ADDRESS),
};
