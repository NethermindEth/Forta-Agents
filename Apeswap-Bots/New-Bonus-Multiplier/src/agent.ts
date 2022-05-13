import { Finding, HandleTransaction, TransactionEvent, ethers } from "forta-agent";
import { contractType, APESWAP_MASTER_APE, UPDATE_MULTIPLIER_FUNCTION, createFinding } from "./utils";

export function provideBotHandler(contractInfo: contractType): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const functionInvocations = txEvent.filterFunction(UPDATE_MULTIPLIER_FUNCTION, contractInfo.address);
    functionInvocations.forEach((invocation) => {
      const { args }: { args: ethers.utils.Result } = invocation;
      findings.push(createFinding(`${args.multiplierNumber}`, contractInfo));
    });

    return findings;
  };
}

export default {
  handleTransaction: provideBotHandler(APESWAP_MASTER_APE),
};
