import { Finding, getJsonRpcUrl, BlockEvent, HandleBlock } from "forta-agent";
import BigNumber from "bignumber.js";
import abi from "./pool.abi";
import Web3 from "web3";
import {
  getBPSValue,
  getTokensHere,
  getTotalDebtRatio,
  getTotalValue,
  createFinding,
  getPools,
} from "./utils";

const web3 = new Web3(getJsonRpcUrl());

// pool.tokenHere()> 20% of pool.totalValue()

function provideHandleFunction(web3: Web3): HandleBlock {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const blockNumber = blockEvent.blockNumber;

    const pools: any = await getPools(web3, blockNumber);

    for (let x = 0; x < pools.length; x++) {
      const contract = new web3.eth.Contract(abi as any, pools[x]);
      const totalValue = new BigNumber(
        await getTotalValue(contract, blockNumber)
      );
      const tokenHere = new BigNumber(
        await getTokensHere(contract, blockNumber)
      );

      if (tokenHere.isGreaterThan(totalValue.multipliedBy(0.2))) {
        findings.push(createFinding(tokenHere.toNumber()));
      }
    }

    return findings;
  };
}

export default {
  handleBlock: provideHandleFunction(web3),
  provideHandleFunction,
};
