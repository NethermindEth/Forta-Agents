import abi from "./abi";
import findings from "./findings";
import { TransactionEvent } from "forta-agent";

const CAKE_ADDRESS = "0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA";

console.log("hello world");
export const provideHandleTransaction = (cakeAddress: string) => async (txEvent: TransactionEvent) =>
  txEvent.filterLog(abi.CAKE, cakeAddress).map(findings.resolver);

export default {
  handleTransaction: provideHandleTransaction(CAKE_ADDRESS),
};
