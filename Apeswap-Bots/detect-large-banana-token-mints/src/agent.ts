import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

import { formatEther } from "@ethersproject/units";

import { createFinding, contractMetaData, contractType } from "./utils";

import { GLOBALS } from "./constants";

const { BANANA_MINT_FUNCTION, BANANA_MINT_AMOUNT } = GLOBALS;
export let exportedNetwork: string;

const mintTxHandler = (functionAbi: string | string[], contractInfo: contractType): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const bananaMints = txEvent.filterFunction(functionAbi);

    bananaMints.forEach((bananaMint) => {
      const { transaction, network } = txEvent;

      const txTo: string | undefined = transaction.to?.toString();

      const { args } = bananaMint;
      const [amount] = args;

      const txValue: string = formatEther(amount);

      const botMetaData = {
        from: transaction.from,
        to: txTo,
        value: txValue,
        network: network.toString(),
      };

      const txValueToNum: number = parseFloat(txValue);

      if (txValueToNum >= BANANA_MINT_AMOUNT) {
        findings.push(createFinding(botMetaData));
      }
    });
    return findings;
  };
};

export default {
  handleTransaction: mintTxHandler(BANANA_MINT_FUNCTION, contractMetaData),
};

export { mintTxHandler };
