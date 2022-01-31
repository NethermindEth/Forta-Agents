import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  return findings;
};

export default {
  handleTransaction,
};
