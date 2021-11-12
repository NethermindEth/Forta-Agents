import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";
import { getYearnVaults, getAccounts } from "./utils";
import Web3 from "web3";
import abi from "./abi";
const web3 = new Web3(getJsonRpcUrl());

let findingsCount = 0;

const withdrawPermittedValues = {};

const providerHandleBlock = (web3: Web3): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    // spin up ganache fork with mainnet
    // unlock a participating account
    // call withdraw function on the cli
    const getAccount = await getAccounts();

    console.log(getAccount);
    // const vaults = await getYearnVaults(web3, blockEvent.blockNumber);

    // vaults.forEach((value, index) => {
    //   const contract = new web3.eth.Contract(abi as any, value);
    // });

    return findings;
  };
};

export default {
  handleBlock: providerHandleBlock(web3),
  providerHandleBlock,
};
