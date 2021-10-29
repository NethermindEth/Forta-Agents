import { Finding, getJsonRpcUrl, BlockEvent, HandleBlock } from "forta-agent";

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

// pool.tokenHere() - pool.totalValue()*(MAX_BPS-totalDebtRatio) > 10% of pool.totalValue()

function provideHandleFunction(web3: Web3): HandleBlock {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const blockNumber = blockEvent.blockNumber;

    const pools: any = await getPools(web3, blockNumber);
    console.log(pools, pools.length);

    for (let x = 0; x < pools.length; x++) {
      const contract = new web3.eth.Contract(abi as any, pools[x]);

      const totalValue = await getTotalValue(contract, blockNumber);
      const tokenHere = await getTokensHere(contract, blockNumber);
      const MAX_BPS = await getBPSValue(contract, blockNumber);
      const totalDebtRatio = await getTotalDebtRatio(contract, blockNumber);

      const idleFunds = tokenHere - totalValue * (MAX_BPS * totalDebtRatio);

      if (idleFunds > 0.1 * totalValue) {
        findings.push(createFinding(idleFunds));
      }
    }

    return findings;
  };
}

export default {
  handleBlock: provideHandleFunction(web3),
  provideHandleFunction,
};
