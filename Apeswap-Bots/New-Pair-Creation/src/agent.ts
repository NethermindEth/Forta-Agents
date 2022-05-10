import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { APEFACTORY_ABI } from "./constants";

import { createFinding, newPairParamsType, newPairFindingType, providerParams } from "./utils";
const { CREATE_PAIR_FUNCTION } = APEFACTORY_ABI;

export const provideHandleTransaction = ({ functionSig, address }: newPairParamsType): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const txLogs = txEvent.filterFunction(functionSig, address);

    txLogs.forEach((txLog) => {
      const { args } = txLog;

      const newPairMetadata: newPairFindingType = {
        tokenAAddress: args[0].toLowerCase(),
        tokenBAddress: args[1].toLowerCase(),
      };

      findings.push(createFinding(newPairMetadata, CREATE_PAIR_FUNCTION));
    });
    return findings;
  };
};
export default {
  handleTransaction: provideHandleTransaction(providerParams),
};
