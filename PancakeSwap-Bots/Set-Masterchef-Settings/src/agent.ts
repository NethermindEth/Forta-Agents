import abi from "./abi";
import findings from "./findings";
import { TransactionEvent } from "forta-agent";

const MasterChef_Address = "0x73feaa1eE314F8c655E354234017bE2193C9E24E";

export const provideHandleTransaction = (cakeAddress: string) => async (txEvent: TransactionEvent) =>
  txEvent.filterLog(abi.CAKE, cakeAddress).map(findings.resolver);

export default {
  handleTransaction: provideHandleTransaction(MasterChef_Address),
};