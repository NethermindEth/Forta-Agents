import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

const FACTORY: string = "0x918d7e714243F7d9d463C37e106235dCde294ffC"; // V1 address (no V2 deployed)

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  return findings;
};

export default {
  handleTransaction,
};
