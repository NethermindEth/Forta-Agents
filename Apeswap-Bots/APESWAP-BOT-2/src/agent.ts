import { tokenType, APESWAP_GNANA, includeAndExcludeFunctions, createFinding, functionDetails } from "./utils";

import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

function provideBotHandler(tokenInfo: tokenType, functionAbi: string | string[]): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const functionInvocations = txEvent.filterFunction(functionAbi, tokenInfo.address);
    functionInvocations.forEach((invocation) => {
      const { args, name }: functionDetails = invocation;
      findings.push(createFinding(args.account, name, tokenInfo));
    });

    return findings;
  };
}

export default {
  handleTransaction: provideBotHandler(APESWAP_GNANA, includeAndExcludeFunctions),
};

export { tokenType, APESWAP_GNANA, includeAndExcludeFunctions, createFinding, functionDetails, provideBotHandler };
