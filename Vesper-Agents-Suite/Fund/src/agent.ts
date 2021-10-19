import BigNumber from "bignumber.js";
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";

import Web3 from "web3";
const web3 = new Web3(getJsonRpcUrl());

import Pool from "./pool";
const defaultList: Array<string> = [];

// pool.tokenHere() - pool.totalValue()*(MAX_BPS-totalDebtRatio) > 10% of pool.totalValue()
const protocolAddress = "0x8d0b8e2b5584cE1487317f81Da7d97397eF3e899";

function provideHandleFunction(
  web3: any,
  pools: Array<string>
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (!txEvent.addresses[protocolAddress]) return findings;

    const totalValue = await contract.methods.totalValue().call();
    const tokenHere = await contract.methods.tokenHere().call();
    const MAX_BPS = 
    const totalDebtRatio = await contract.methods.

    return findings;
  };
}

export default {
  handleTransaction: provideHandleFunction(web3, defaultList),
  provideHandleFunction,
};
