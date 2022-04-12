import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import abi from "./abi";
import { utils } from "ethers";
import { createFinding } from "./findings";

const REGISTRY: string = "0xf69c52bf2cf76250647c0bb5390d4ba8854a1d4a";

const provideHandleTransaction =
  (registry: string): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const desc: utils.TransactionDescription[] = txEvent.filterFunction(abi.REGISTRY, registry);

    desc.forEach((txDesc: utils.TransactionDescription) => findings.push(createFinding(txDesc, txEvent.from)));

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(REGISTRY),
  provideHandleTransaction,
};
