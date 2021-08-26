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

import { pairContract } from "./abi";

// @ts-ignore
import abiDecoder from "abi-decoder";

// not working with the whole abi. : TODO
abiDecoder.addABI(pairContract);

function checkFeasibility(tx1: any, tx2: any) {
  const first = web3.eth.abi.decodeParameters(
    ["uint256", "uint256", "uint256"],
    tx1[3].value
  );
  const second = web3.eth.abi.decodeParameters(
    ["uint256", "uint256", "uint256"],
    tx2[3].value
  );

  return (
    Object.keys(first).length === 4 &&
    Object.keys(second).length === 4 &&
    first[0] === second[0] &&
    first[1] === second[1]
  );
}

const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
  const findings: Finding[] = [];

  const txs = blockEvent.block.transactions;

  let swapTxs = [];

  // extract all swap events
  for (let i in txs) {
    const decodedData = abiDecoder.decodeMethod(txs[i]);

    if (decodedData != undefined && decodedData.name === "swap") {
      swapTxs.push(decodedData);
    } else {
      continue;
    }
  }

  if (swapTxs.length === 1) {
    return findings;
  }

  // since the txs need to be as close in order as possible we can just pair the consecutive txs.
  // Better apporach: to know the token which is being swapped and then order consecutively.
  // This is determined by the contract itself using token1() token2() function
  // Track all those here for much more accurate results in production
  // This agent only deals with the final swap event emitted.

  for (let i = 0; i < swapTxs.length - 2; ) {
    const tx1 = swapTxs[i].params;
    const tx2 = swapTxs[i + 1].params;
    const tx3 = swapTxs[i + 2].params;

    if (checkFeasibility(tx1, tx2)) {
      i = i + 3;

      const {
        "0": r1,
        "1": r2,
        "2": m,
      } = web3.eth.abi.decodeParameters(
        ["uint256", "uint256", "uint256"],
        tx2[3].value
      );

      const x = tx2[0].value;
      const v = tx1[0].value;

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
            alertId: "NETHFORTA-8",
            severity: FindingSeverity.High,
            type: FindingType.Exploit,
            metadata: {
              r1,
              r2,
              x,
              v,
              m,
            },
          })
        );
      }
    } else {
      i++;
    }
  }

  return findings;
};

export default {
  handleBlock,
};
