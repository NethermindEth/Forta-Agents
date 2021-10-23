import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";

import abi from "./pool.abi";
import Web3 from "web3";
import { defaultList } from "./utils";

const web3 = new Web3(getJsonRpcUrl());

// pool.tokenHere() - pool.totalValue()*(MAX_BPS-totalDebtRatio) > 10% of pool.totalValue()
const protocolAddress = "0xBA680a906d8f624a5F11fba54D3C672f09F26e47";

function provideHandleFunction(
  web3: Web3,
  pools: Array<string>
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (!txEvent.addresses[protocolAddress]) return findings;

    const promises: Array<any> = [];

    for (let x = 0; x < pools.length; x++) {
      const contract = new web3.eth.Contract(abi as any, pools[x]);
      const totalValue = await contract.methods.totalValue().call();
      const tokenHere = await contract.methods.tokensHere().call();
      const MAX_BPS = await contract.methods.MAX_BPS().call();
      const totalDebtRatio = await contract.methods.totalDebtRatio().call();

      if (
        tokenHere - totalValue * (MAX_BPS * totalDebtRatio) >
        0.1 * totalValue
      ) {
        findings.push(
          Finding.fromObject({
            name: "Fund Ratio",
            alertId: "NethForta-Vesper-3",
            description: "There is idle fund in the pool",
            severity: FindingSeverity.High,
            type: FindingType.Suspicious,
          })
        );
      }
    }

    return findings;
  };
}

export default {
  handleTransaction: provideHandleFunction(web3, defaultList),
  provideHandleFunction,
};
