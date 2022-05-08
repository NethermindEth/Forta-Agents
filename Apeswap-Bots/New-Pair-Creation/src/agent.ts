import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

import { createFinding, newPairParamsType, newPairFindingType, providerParams } from "./utils";

const createPairProvider = ({ createFunctionSig, address }: newPairParamsType): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const txLogs = txEvent.filterFunction(createFunctionSig, address);

    txLogs.forEach((txLog) => {
      const { args } = txLog;

      const newPairMetadata: newPairFindingType = {
        tokenAAddress: args[0].toLowerCase(),
        tokenBAddress: args[1].toLowerCase(),
      };

      findings.push(createFinding(newPairMetadata));
    });
    return findings;
  };
};
export default {
  handleTransaction: createPairProvider(providerParams),
};

export { createPairProvider };
