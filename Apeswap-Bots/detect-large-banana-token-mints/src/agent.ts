import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

import { GLOBALS } from "./constants";

import { formatEther } from "@ethersproject/units";

const { BANANA_CONTRACT_ADDRESS_BNBCHAIN, BANANA_MINT_FUNCTION, BANANA_MINT_AMOUNT } = GLOBALS;

let findingsCount = 0;

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  // limiting this agent to emit only 5 findings so that the alert feed is not spammed
  if (findingsCount >= 5) return findings;

  // filter transaction logs for Banana token mints
  const bananaMints = txEvent.filterFunction(BANANA_MINT_FUNCTION, BANANA_CONTRACT_ADDRESS_BNBCHAIN);

  const { from, to } = txEvent.transaction;
  const txTo: any = to;

  bananaMints.forEach((bananaMint) => {
    const { args } = bananaMint;

    const [txValue] = args;

    const formattedValue: any = formatEther(txValue);

    if (formattedValue > BANANA_MINT_AMOUNT) {
      findings.push(
        Finding.fromObject({
          name: "Large Banana Mint",
          description: `Large amount of BANANA minted: ${formattedValue}`,
          protocol: "Apeswap-1",
          alertId: "APESWAP-1",
          severity: FindingSeverity.Critical,
          type: FindingType.Suspicious,
          metadata: {
            value: formattedValue,
            from,
            to: txTo,
          },
        })
      );
      findingsCount++;
    }
  });
  return findings;
};

export default {
  handleTransaction,
};

export { BANANA_CONTRACT_ADDRESS_BNBCHAIN, BANANA_MINT_FUNCTION, BANANA_MINT_AMOUNT };
