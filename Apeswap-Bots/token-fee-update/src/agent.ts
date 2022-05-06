import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import utils from "./utils";

const REFLECT_TOKEN_ADDRESS = "0xddb3bd8645775f59496c821e4f55a7ea6a6dc299"
export const handleTransaction =
  (reflectTokenAddress:string): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const tV2GeneralLogs = txEvent.filterLog(
      utils.EVENT_ABI,
    );

  

    return findings;
  };

export default {
  handleTransaction: handleTransaction(
    REFLECT_TOKEN_ADDRESS
  ),
};
