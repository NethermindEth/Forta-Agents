import { Interface } from "@ethersproject/abi";

import { Finding, FindingSeverity, FindingType } from "forta-agent";

const LENDING_POOL_ADDRESS = "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa";

const REENTERANCY_FUNCTIONS_SIGNATURES: string[] = [];
const FUNCTIONS_INTERFACE = new Interface(REENTERANCY_FUNCTIONS_SIGNATURES);
const createFinding = (transactionName: string): Finding => {
  return Finding.fromObject({
    name: "Lending Pool Reentrancy",
    description: `transaction ${transactionName} is reentrant`,
    alertId: "Um-09",
    type: FindingType.Suspicious,
    severity: FindingSeverity.High,
    metadata: {
      transactionName: transactionName,
    },
  });
};

export default {
  LENDING_POOL_ADDRESS,
  FUNCTIONS_INTERFACE,
  REENTERANCY_FUNCTIONS_SIGNATURES,
  createFinding,
};
