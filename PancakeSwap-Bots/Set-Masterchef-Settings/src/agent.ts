import abi from "./abi";
import findings from "./findings";
import { TransactionEvent } from "forta-agent";

const MasterChef_Address = "0xE115b296916E63C74E01506d37c6CF2C9fBaa9E0";

export const provideHandleTransaction = (cakeAddress: string) => async (txEvent: TransactionEvent) =>
  txEvent.filterLog(abi.CAKE, cakeAddress).map(findings.resolver);

export default {
  handleTransaction: provideHandleTransaction(MasterChef_Address),
};