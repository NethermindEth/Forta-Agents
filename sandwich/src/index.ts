import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";

import { detectIfAttackPossible } from "./utils";

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

const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"; // change
const usdtAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7"; // change
const contractAddress = "0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f";
const methodId = "0x8803dbee"; //methodId of Uniswap Swaps "0x8803dbee" 
// const contractAddress = await factoryContract.methods
// .getPair(usdcAddress, usdtAddress)
// .call();

export const token0Contract = new web3.eth.Contract(erc20 as any, usdcAddress);
export const token1Contract = new web3.eth.Contract(erc20 as any, usdtAddress);

function provideHandleTransaction(
  web3: Web3,
  token0Contract: any,
  token1Contract: any
): HandleBlock {
  return async function handleBlock(blockEvent: BlockEvent) {
    const findings: Finding[] = [];

    const txs = blockEvent.block.transactions;

    let swapTxs = [];

    // extract all swap events
    for (let i in txs) {
      const data = await web3.eth.getTransaction(txs[i]);
      const id = (data.input).slice(0,10);

      if (
        methodId === id &&
        data.to === contractAddress
      ) {
      const decodedData = abiDecoder.decodeMethod(data.input);
        swapTxs.push(decodedData);
      }
    }

    if (swapTxs.length <= 1) {
      return findings;
    }

    let r1 = await token0Contract.methods.balanceOf(contractAddress).call(); // token0 reserves
    let r2 = await token1Contract.methods.balanceOf(contractAddress).call(); // token1 reserves

    for (let i = 0; i < swapTxs.length - 2; ) {
      const [x] = swapTxs[i].params.map((y: any) => y.value); //Mapping to get AmountIn of Tx1
      const [v, m] = swapTxs[i+1].params.map((z: any) => z.value); //Mapping to get AmountIn & AmountOutMin

      if (
        detectIfAttackPossible(
          parseFloat(r1),
          parseFloat(r2),
          parseFloat(x),
          parseFloat(v),
          parseFloat(m)
        )
      ) {
        i = i + 2;
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
      } else {
        i++;
      }
    }

    return findings;
  };
}

export default {
  handleBlock: provideHandleTransaction(web3, token0Contract, token1Contract),
  provideHandleTransaction,
};
