import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { utils, BigNumber } from "ethers";
import { PGL_CONTRACT, TESTNET_CONTRACT, SWAP_ABI, createFinding } from "./utils";

export const provideHandleTransaction =
  (pglContract: string): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // Filter for `swap` function calls in PGL contract
    const txns: utils.TransactionDescription[] = txEvent.filterFunction(SWAP_ABI, pglContract);

    txns.forEach((txn) => {
      // Per the docs, a flash swap occurs when `swap` is called with
      // the `data` argument length being more than zero. Similarly,
      // we are generating Findings only when value of `data` is
      // more than zero.
      if (txn.args["data"] != "0x" && BigNumber.from(txn.args["data"]).gt(BigNumber.from("0"))) {
        findings.push(
          createFinding(
            txn.args["amount0Out"].toString(),
            txn.args["amount1Out"].toString(),
            txn.args["to"].toLowerCase()
          )
        );
      }
    });

    return findings;
  };

export default {
  // Line below for use with Avalanche mainnet:
  handleTransaction: provideHandleTransaction(PGL_CONTRACT),
  // Line below for use with Avalanche Fuji testnet:
  // handleTransaction: provideHandleTransaction(TESTNET_CONTRACT)
};
