import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  Block,
  getJsonRpcUrl,
} from "forta-agent";

import {
  detectIfAttackPossible,
  minimumInputAmountForFrontrunningT1,
} from "./utils";

import Web3 from "web3";
const web3 = new Web3(getJsonRpcUrl());

import { abi as routerContract } from "./router";
import factory from "./factory";
import erc20 from "./erc20";

// @ts-ignore
import abiDecoder from "abi-decoder";

// not working with the whole abi. : TODO
abiDecoder.addABI(routerContract);

const factoryContract = new web3.eth.Contract(
  factory as any,
  "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
);

const usdtAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const wethAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";

export const token0Contract = new web3.eth.Contract(erc20 as any, wethAddress);
export const token1Contract = new web3.eth.Contract(erc20 as any, usdtAddress);

const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
  const findings: Finding[] = [];

  const txs = blockEvent.block.transactions;

  let swapTxs = [];

  // extract all swap events
  for (let i in txs) {
    const decodedData = abiDecoder.decodeMethod(txs[i]);

    if (
      decodedData != undefined &&
      decodedData.name === "swapTokensForExactTokens"
    ) {
      swapTxs.push(decodedData);
    } else {
      continue;
    }
  }

  if (swapTxs.length === 1) {
    return findings;
  }

  const contractAddress = await factoryContract.methods
    .getPair(wethAddress, usdtAddress)
    .call();

  // to fetch reserves from the block just before the current one
  //contract.defaultBlock = blockEvent.blockNumber - 1;
  let r1 = await token0Contract.methods.balanceOf(contractAddress).call(); // token0 reserves
  let r2 = await token1Contract.methods.balanceOf(contractAddress).call(); // token1 reserves

  for (let i = 0; i < swapTxs.length - 2; ) {
    const tx1 = swapTxs[i].params;
    const tx2 = swapTxs[i + 1].params;
    i = i + 3;

    const x = tx1[0].value;
    const v = tx2[0].value;
    const m = tx2[1].value;

    if (
      detectIfAttackPossible(
        parseFloat(r1),
        parseFloat(r2),
        parseFloat(x),
        parseFloat(v),
        parseFloat(m)
      )
    ) {
      findings.push(
        Finding.fromObject({
          name: "MEV Attack Detected",
          description: `Block number ${blockEvent.blockNumber} detected MEV attack`,
          alertId: "NETHFORTA-20",
          severity: FindingSeverity.High,
          type: FindingType.Exploit,
          metadata: {
            x,
            v,
            m,
          },
        })
      );
    }
  }

  return findings;
};

export default {
  handleBlock,
};
