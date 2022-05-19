import { Interface } from "@ethersproject/abi";

import { Finding, FindingSeverity, FindingType } from "forta-agent";

const LENDING_POOL_ADDRESS = "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa";

const REENTERANCY_FUNCTIONS_SIGNATURES: string[] = [
  "borrow(address,uint256,uint256,uint16,address)",
  "withdraw(address,uint256,address)",
  "flashLoan(address,address[],uint256[],uint256[],address,bytes,uint16)",
];
const REENTERANCY_FUNCTIONS_ABI: string[] = [
  "function borrow(address asset,uint256 amount,uint256 interestRateMode,uint16 referralCode,address onBehalfOf)",
  "function withdraw(address asset,uint256 amount,address to)",
  "function flashLoan(address receiverAddress,address[] calldata assets,uint256[] calldata amounts,uint256[] calldata modes,address onBehalfOf,bytes calldata params,uint16 referralCode)",
];

const FUNCTIONS_INTERFACE = new Interface(REENTERANCY_FUNCTIONS_ABI);

const createFinding = (transactionName: string): Finding => {
  return Finding.fromObject({
    name: "Lending Pool Reentrancy",
    description: `${transactionName} transaction is reentrant`,
    alertId: "Um-09",
    type: FindingType.Exploit,
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
